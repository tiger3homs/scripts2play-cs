// ==UserScript==
// @name         Combined Scoreboard Tracker (v5.0)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Automatically tracks & manually captures CS scoreboard with detailed player stats to SheetDB, detects halves, and handles match resets.
// @match        https://game.play-cs.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION & STATE ---
    const CFG = {
        SHEETDB_PREFIX: "https://sheetdb.io/api/v1/",
        CHECK_INTERVAL: 5000, // every 5 seconds
        MSG_DURATION: 3500
    };

    let SHEETDB_API_URL = GM_getValue("SHEETDB_API_URL", "");
    let currentHalf = "First Half";
    let currentMatchId = 1;
    let halfEnded = false;
    let matchEnded = false;
    let monitoring = false;
    let firstHalfScores = null; // To store scores like { ct: 8, tr: 7 }

    // --- UTILITIES ---
    const log = (...a) => console.log("[CombinedSBS]", ...a);
    const err = (...a) => console.error("[CombinedSBS]", ...a);
    const c2e = (c) => (c && /^[a-zA-Z]{2}$/.test(c)) ? c.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0))) : "🏳️";

    function arePlayersSimilar(playersA, playersB, threshold = 0.5) {
        if (!playersA || !playersB || playersA.length === 0 || playersB.length === 0) return false;
        try {
            const jsonA = JSON.parse(playersA);
            const idsA = new Set(jsonA.map(p => p.id || p.name));
            const jsonB = JSON.parse(playersB);
            const idsB = new Set(jsonB.map(p => p.id || p.name));
            const intersection = new Set([...idsA].filter(id => idsB.has(id)));
            const similarity = intersection.size / Math.max(idsA.size, idsB.size);
            return similarity >= threshold;
        } catch (e) {
            err("Player comparison error:", e);
            return false;
        }
    }

    // ================= UI MESSAGES =================
    function showMsg(msg, color = "lightgreen", timeout = CFG.MSG_DURATION) {
        const el = document.createElement("div");
        el.textContent = msg;
        Object.assign(el.style, {
            position: "fixed", top: "15px", right: "15px",
            background: color, color: "black",
            padding: "10px 14px", borderRadius: "8px",
            zIndex: 99999, fontWeight: "bold",
            boxShadow: "0 0 10px rgba(0,0,0,0.25)"
        });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), timeout);
    }

    // ================= SHEETDB HELPERS =================
    async function fetchLastMatchInfo() {
        if (!SHEETDB_API_URL) return null;
        try {
            const res = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `${SHEETDB_API_URL}?sort_by=Date&sort_order=desc&limit=1`,
                    onload: (res) => resolve(res),
                    onerror: (err) => reject(err)
                });
            });
            const data = JSON.parse(res.responseText);
            return data?.[0] || null;
        } catch (e) {
            err("fetchLastMatchInfo error:", e);
            return null;
        }
    }

    async function sendToSheetDB(payload) {
        if (!SHEETDB_API_URL) {
            showMsg("❌ SheetDB URL not set! (Alt+Shift+S)", "red");
            return;
        }
        GM_xmlhttpRequest({
            method: "POST",
            url: SHEETDB_API_URL,
            data: JSON.stringify({ data: payload }),
            headers: { "Content-Type": "application/json" },
            onload: (res) => {
                if (res.status === 201 || res.status === 200) {
                    showMsg(`✅ Uploaded (${payload.Half})`);
                } else {
                    err("Upload failed:", res);
                    showMsg(`❌ Upload failed (${res.status})`, "red");
                }
            }
        });
    }

    // ================= DATA CAPTURE =================
    const getPlayerExtraInfo = () => new Promise((resolve) => {
        const script = document.createElement('script');
        script.textContent = `
            document.dispatchEvent(new CustomEvent('sbs:playerInfo', {
                detail: window.g_PlayerExtraInfo || null
            }));
        `;
        document.head.appendChild(script);
        document.head.removeChild(script);
        const listener = (e) => {
            document.removeEventListener('sbs:playerInfo', listener);
            resolve(e.detail);
        };
        document.addEventListener('sbs:playerInfo', listener);
    });

    async function captureAndSend(forcedHalf = null) {
        const sb = document.querySelector(".hud-scoreboard");
        if (!sb) return showMsg("⚠️ Scoreboard not found", "orange");

        const playerExtraInfo = await getPlayerExtraInfo();
        const map = document.querySelector(".hud-map-name")?.textContent?.trim() || "Unknown";
        const ctScore = parseInt(sb.querySelector(".scoreboard-hud-ct-head span")?.textContent) || 0;
        const trScore = parseInt(sb.querySelector(".scoreboard-hud-tr-head span")?.textContent) || 0;
        const half = forcedHalf || currentHalf;

        const getPlayers = (sel, team) => {
            const players = [];
            sb.querySelectorAll(sel).forEach(row => {
                const cols = row.querySelectorAll("td");
                if (cols.length < 5) return;
                let rawName = cols[1]?.innerText.trim() || "Unknown";
                let cleanedName = rawName.replace(/^(\[.*?\]|<.*?>|\(.*?\))\s*/, '').trim() || rawName;
                let countryCode = (cols[1]?.querySelector(".flag-icon")?.classList.value.match(/flag-icon-([a-z]{2})/)?.[1] || "").toUpperCase();
                let kills = parseInt(cols[3]?.innerText, 10) || 0;
                let deaths = parseInt(cols[4]?.innerText, 10) || 0;
                let playerId = null;

                if (playerExtraInfo) {
                    const playerEntry = Object.entries(playerExtraInfo).find(([id, data]) => data.name === cleanedName);
                    if (playerEntry) playerId = playerEntry[0];
                }

                if (kills > 0 || deaths > 0) {
                    players.push({ id: playerId, name: cleanedName, kills, deaths, flag: c2e(countryCode), team });
                }
            });
            return players;
        };

        const ctPlayers = getPlayers(".scoreboard-hud-ct-body tr", "CT");
        const trPlayers = getPlayers(".scoreboard-hud-tr-body tr", "TR");
        const allPlayers = [...ctPlayers, ...trPlayers];

        const payload = {
            Map: map,
            Half: half,
            "CT Score": ctScore,
            "TR Score": trScore,
            "Date": new Date().toLocaleString(),
            "Match ID": currentMatchId,
            "Players JSON": JSON.stringify(allPlayers)
        };

        // --- CONSOLE LOG ---
        log("--- Scoreboard Captured ---");
        log(`Match ID: ${payload["Match ID"]}, Half: ${payload.Half}`);
        log(`Map: ${payload.Map}, Score: CT ${payload["CT Score"]} - TR ${payload["TR Score"]}`);
        console.table(allPlayers);
        log("--------------------------");


        await sendToSheetDB(payload);
    }

    // ================= AUTO MONITOR =================
    async function startAutoMonitor() {
        if (monitoring) return;
        monitoring = true;
        showMsg("📊 Auto scoreboard monitor started", "lightgreen");

        // --- INITIAL STATE SETUP ---
        const last = await fetchLastMatchInfo();
        if (last) {
            currentMatchId = parseInt(last["Match ID"]) || 1;
            if (last["Half"] === "First Half") {
                currentHalf = "Second Half";
                halfEnded = true;
                firstHalfScores = { ct: parseInt(last["CT Score"]), tr: parseInt(last["TR Score"]) };
            } else {
                currentMatchId++;
                currentHalf = "First Half";
            }
        }

        // --- MAIN MONITORING LOOP ---
        setInterval(async () => {
            const sb = document.querySelector(".hud-scoreboard");
            if (!sb) return;

            const ct = parseInt(sb.querySelector(".scoreboard-hud-ct-head span")?.textContent) || 0;
            const tr = parseInt(sb.querySelector(".scoreboard-hud-tr-head span")?.textContent) || 0;
            const totalRounds = ct + tr;

            // --- 1. FIRST HALF END DETECTION ---
            if (!halfEnded && totalRounds === 15) {
                showMsg("🕒 First Half ended — uploading...", "yellow");
                await captureAndSend("First Half");
                firstHalfScores = { ct, tr };
                halfEnded = true;
                currentHalf = "Second Half";
                return;
            }

            // --- 2. SWAP / NEW MATCH DETECTION ---
            if (halfEnded && !matchEnded && totalRounds === 0) {
                const lastRow = await fetchLastMatchInfo();
                if (lastRow && lastRow["Half"] === "First Half") {
                    showMsg("🔁 Swap detected — continuing (Second Half)", "lightblue");
                    currentHalf = "Second Half";
                    matchEnded = false;
                    firstHalfScores = { ct: parseInt(lastRow["CT Score"]), tr: parseInt(lastRow["TR Score"]) };
                } else if (lastRow && lastRow["Half"] === "Second Half") {
                    showMsg("🆕 New match detected — incrementing ID", "lightgreen");
                    currentMatchId++;
                    currentHalf = "First Half";
                    halfEnded = false;
                    matchEnded = false;
                    firstHalfScores = null;
                }
                return;
            }

            // --- 3. SECOND HALF END DETECTION (Corrected Logic) ---
            if (halfEnded && !matchEnded && firstHalfScores) {
                // The team that was CT in H1 is now TR. Their total score is their H1 score + current TR score.
                const totalScoreFormerCT = firstHalfScores.ct + tr;
                // The team that was TR in H1 is now CT. Their total score is their H1 score + current CT score.
                const totalScoreFormerTR = firstHalfScores.tr + ct;

                // Win condition: A team's total score reaches 16.
                if (totalScoreFormerCT >= 16 || totalScoreFormerTR >= 16) {
                    showMsg("🏁 Match ended — uploading Second Half...", "yellow");
                    await captureAndSend("Second Half");
                    matchEnded = true;
                    firstHalfScores = null;
                    return;
                }
            }

            // --- 4. RESET AFTER A FULL MATCH ---
            if (matchEnded && totalRounds === 0) {
                const lastEntry = await fetchLastMatchInfo();
                if (lastEntry && lastEntry["Half"] === "Second Half") {
                    showMsg("⚡ New match initialized", "lightgreen");
                    currentMatchId = parseInt(lastEntry["Match ID"]) + 1;
                    currentHalf = "First Half";
                    halfEnded = false;
                    matchEnded = false;
                    firstHalfScores = null;
                }
            }
        }, CFG.CHECK_INTERVAL);
    }

    // ================= SETTINGS UI =================
    function openSettingsModal() {
        if (document.getElementById("sbs-modal")) return;
        const modal = document.createElement("div");
        modal.id = "sbs-modal";
        Object.assign(modal.style, {
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 10000
        });
        const box = document.createElement("div");
        Object.assign(box.style, {
            background: "#2c2f33", color: "#fff", padding: "20px",
            borderRadius: "8px", width: "400px", boxShadow: "0 0 10px rgba(0,0,0,0.3)"
        });
        box.innerHTML = `
            <h3 style="margin-top:0;text-align:center;color:#2ecc71;">SheetDB Settings</h3>
            <input id="sheetdb-url" type="text" placeholder="${CFG.SHEETDB_PREFIX}..." style="width:100%;padding:8px;border-radius:4px;border:none;margin-bottom:10px;background:#40444b;color:white;">
            <div style="display:flex;justify-content:space-between;">
                <button id="save-url" style="padding:8px 16px;background:#2ecc71;color:white;border:none;border-radius:4px;">Save</button>
                <button id="clear-url" style="padding:8px 16px;background:#e74c3c;color:white;border:none;border-radius:4px;">Clear</button>
                <button id="close-url" style="padding:8px 16px;background:#95a5a6;color:white;border:none;border-radius:4px;">Close</button>
            </div>
        `;
        modal.appendChild(box);
        document.body.appendChild(modal);
        const input = box.querySelector("#sheetdb-url");
        input.value = SHEETDB_API_URL;
        box.querySelector("#save-url").onclick = async () => {
            const val = input.value.trim();
            if (val.startsWith(CFG.SHEETDB_PREFIX)) {
                SHEETDB_API_URL = val;
                await GM_setValue("SHEETDB_API_URL", val);
                showMsg("✅ SheetDB URL saved", "green");
                modal.remove();
            } else showMsg("❌ Invalid URL", "red");
        };
        box.querySelector("#clear-url").onclick = async () => {
            SHEETDB_API_URL = "";
            await GM_setValue("SHEETDB_API_URL", "");
            showMsg("🧹 Cleared SheetDB URL", "orange");
            modal.remove();
        };
        box.querySelector("#close-url").onclick = () => modal.remove();
    }

    // ================= HOTKEYS =================
    document.addEventListener("keydown", (e) => {
        if (e.altKey && e.shiftKey && e.key.toLowerCase() === "s") {
            e.preventDefault();
            openSettingsModal();
        }
        if (["p", "k"].includes(e.key.toLowerCase())) {
            e.preventDefault();
            showMsg("⌨️ Manual capture...", "lightblue");
            captureAndSend();
        }
    });

    // ================= INIT =================
    (function init() {
        showMsg("✅ Combined Script loaded (P/K manual, Alt+Shift+S settings)", "lightgreen");
        startAutoMonitor();
    })();

})();
