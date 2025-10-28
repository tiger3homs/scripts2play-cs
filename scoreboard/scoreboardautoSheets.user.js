// ==UserScript==
// @name         Play-CS Auto Scoreboard Tracker (v4.0)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Automatically tracks & uploads CS scoreboard to SheetDB, detects halves, handles match resets, and supports manual capture (P/K)
// @match        https://game.play-cs.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const CFG = {
        SHEETDB_PREFIX: "https://sheetdb.io/api/v1/",
        CHECK_INTERVAL: 5000 // every 5 seconds
    };

    let SHEETDB_API_URL = GM_getValue("SHEETDB_API_URL", "");
    let currentHalf = "First Half";
    let currentMatchId = 1;
    let halfEnded = false;
    let matchEnded = false;
    let monitoring = false;

    // ================= UI MESSAGES =================
    function showMsg(msg, color = "lightgreen", timeout = 3500) {
        const el = document.createElement("div");
        el.textContent = msg;
        Object.assign(el.style, {
            position: "fixed",
            top: "15px",
            right: "15px",
            background: color,
            color: "black",
            padding: "10px 14px",
            borderRadius: "8px",
            zIndex: 99999,
            fontWeight: "bold",
            boxShadow: "0 0 10px rgba(0,0,0,0.25)"
        });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), timeout);
    }

    // ================= SHEETDB HELPERS =================
    async function fetchLastMatchInfo() {
        if (!SHEETDB_API_URL) return null;
        try {
            const res = await fetch(`${SHEETDB_API_URL}?sort_by=Date&sort_order=desc&limit=1`);
            const data = await res.json();
            return data?.[0] || null;
        } catch (e) {
            console.error("fetchLastMatchInfo error:", e);
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
                    showMsg(`❌ Upload failed (${res.status})`, "red");
                }
            }
        });
    }

    // ================= CAPTURE =================
    async function captureAndSend(forcedHalf = null) {
        const sb = document.querySelector(".hud-scoreboard");
        if (!sb) return showMsg("⚠️ Scoreboard not found", "orange");

        const map = document.querySelector(".hud-map-name")?.textContent?.trim() || "Unknown";
        const ct = parseInt(sb.querySelector(".scoreboard-hud-ct-head span")?.textContent) || 0;
        const tr = parseInt(sb.querySelector(".scoreboard-hud-tr-head span")?.textContent) || 0;
        const half = forcedHalf || currentHalf;

        const payload = {
            Map: map,
            Half: half,
            "CT Score": ct,
            "TR Score": tr,
            "Date": new Date().toLocaleString(),
            "Match ID": currentMatchId
        };

        await sendToSheetDB(payload);
    }

    // ================= AUTO MONITOR =================
    async function startAutoMonitor() {
        if (monitoring) return;
        monitoring = true;
        showMsg("📊 Auto scoreboard monitor started", "lightgreen");

        // Load last database state
        const last = await fetchLastMatchInfo();
        if (last) {
            currentMatchId = parseInt(last["Match ID"]) || 1;
            currentHalf = last["Half"] === "First Half" ? "Second Half" : "First Half";
        }

        setInterval(async () => {
            const sb = document.querySelector(".hud-scoreboard");
            if (!sb) return;

            const ct = parseInt(sb.querySelector(".scoreboard-hud-ct-head span")?.textContent) || 0;
            const tr = parseInt(sb.querySelector(".scoreboard-hud-tr-head span")?.textContent) || 0;
            const total = ct + tr;

            // --- FIRST HALF ENDED ---
            if (!halfEnded && total === 15) {
                showMsg("🕒 First Half ended — uploading...", "yellow");
                await captureAndSend("First Half");
                halfEnded = true;
                currentHalf = "Second Half";
                return;
            }

            // --- DETECT SWAP / SCORE RESET ---
            if (halfEnded && !matchEnded && ct === 0 && tr === 0) {
                const lastRow = await fetchLastMatchInfo();
                if (lastRow && lastRow["Half"] === "First Half") {
                    showMsg("🔁 Swap detected — continuing same match (Second Half)", "lightblue");
                    currentHalf = "Second Half";
                    halfEnded = true;
                    matchEnded = false;
                } else if (lastRow && lastRow["Half"] === "Second Half") {
                    showMsg("🆕 New match detected — incrementing Match ID", "lightgreen");
                    currentMatchId++;
                    currentHalf = "First Half";
                    halfEnded = false;
                    matchEnded = false;
                }
                return;
            }

            // --- SECOND HALF ENDED ---
            if (halfEnded && !matchEnded && (ct >= 16 || tr >= 16)) {
                showMsg("🏁 Match ended — uploading Second Half...", "yellow");
                await captureAndSend("Second Half");
                matchEnded = true;
                return;
            }

            // --- NEW MATCH AFTER FULL END ---
            if (matchEnded && ct === 0 && tr === 0) {
                const lastEntry = await fetchLastMatchInfo();
                if (lastEntry && lastEntry["Half"] === "Second Half") {
                    showMsg("⚡ New match initialized", "lightgreen");
                    currentMatchId = parseInt(lastEntry["Match ID"]) + 1;
                    currentHalf = "First Half";
                    halfEnded = false;
                    matchEnded = false;
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
            position: "fixed",
            top: 0, left: 0,
            width: "100%", height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000
        });

        const box = document.createElement("div");
        Object.assign(box.style, {
            background: "#2c2f33",
            color: "#fff",
            padding: "20px",
            borderRadius: "8px",
            width: "400px",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)"
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
            captureAndSend();
        }
    });

    // ================= INIT =================
    (function init() {
        showMsg("✅ Script loaded (P/K manual, Alt+Shift+S settings)", "lightgreen");
        startAutoMonitor();
    })();

})();
