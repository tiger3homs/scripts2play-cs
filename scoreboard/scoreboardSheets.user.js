// ==UserScript==
// @name         Scoreboard to SheetDB with Persistent Match ID
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Capture Play-CS scoreboard, send to SheetDB with UI, and provide user feedback.
// @author       tiger3homs (obbe.00 on discord)
// @match        https://game.play-cs.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async () => {
    'use strict';

    // --- CONFIG & STATE ---
    const CFG = {
        API_URL_KEY: "sheetDBApiUrl",
        MSG_DURATION: 3000, // Default message duration for UI notifications
        SHEETDB_PREFIX: "https://sheetdb.io/api/v1/"
    };
    let SHEETDB_API_URL = await GM_getValue(CFG.API_URL_KEY) || "";
    let currentMatchId = null; // Will store the current match ID

    // --- UTILS ---
    const log = (...a) => console.log("[SBS]", ...a);
    const err = (...a) => console.error("[SBS]", ...a);
    const warn = (...a) => console.warn("[SBS]", ...a);

    // Converts 2-letter country code to emoji flag
    const c2e = (c) => (c && /^[a-zA-Z]{2}$/.test(c)) ? c.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0))) : "🏳️";

    // Displays temporary messages in the corner of the screen
    const showMsg = (msg, color = "white", duration = CFG.MSG_DURATION) => {
        let el = document.getElementById("sbs-msg");
        if (!el) {
            el = document.createElement("div");
            el.id = "sbs-msg";
            Object.assign(el.style, {
                position: "fixed", top: "10px", right: "10px", padding: "8px 15px",
                background: "rgba(0,0,0,.7)", borderRadius: "5px", zIndex: "10000",
                fontSize: "14px", fontFamily: "Arial,sans-serif", pointerEvents: "none",
                opacity: "0", transition: "opacity .3s ease-in-out",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)"
            });
            document.body.appendChild(el);
        }
        el.innerText = msg;
        el.style.color = color;
        el.style.opacity = "1";
        clearTimeout(el.hideT);
        el.hideT = setTimeout(() => el.style.opacity = "0", duration);
    };

    // --- API & SCOREBOARD ---
    // Fetch last Match ID from SheetDB
    function fetchLastMatchId(callback) {
        GM_xmlhttpRequest({
            method: "GET",
            url: SHEETDB_API_URL,
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data.length === 0) {
                        callback(0); // No match yet
                    } else {
                        // Get max Match ID from Sheet (assumes numeric)
                        const maxId = Math.max(...data.map(row => parseInt(row["Match ID"] || 0)));
                        callback(maxId);
                    }
                } catch (e) {
                    err("Error parsing SheetDB response:", e);
                    callback(0);
                }
            },
            onerror: (error) => {
                err("Error fetching last match ID:", error);
                callback(0);
            }
        });
    }

    // Capture scoreboard and send
    function captureAndSend(halfLabel = "First Half") {
        if (!SHEETDB_API_URL) {
            warn("SheetDB API URL not set. Use Alt+Shift+S.");
            return showMsg("SheetDB URL not set! Press Alt+Shift+S to configure.", "orange", 5000);
        }

        const sb = document.querySelector(".hud-scoreboard");
        if (!sb) {
            err("Scoreboard element not found.");
            return showMsg("Scoreboard not found!", "red");
        }

        const mapName = sb.querySelector(".map_name")?.innerText.trim() || "Unknown Map";
        const ctScore = parseInt(sb.querySelector(".scoreboard-hud-ct-head span")?.innerText, 10) || 0;
        const trScore = parseInt(sb.querySelector(".scoreboard-hud-tr-head span")?.innerText, 10) || 0;

        const getPlayers = (sel, team) => {
            const players = [];
            sb.querySelectorAll(sel).forEach(row => {
                const cols = row.querySelectorAll("td");
                if (cols.length < 5) return;

                let rawName = cols[1]?.innerText.trim() || "Unknown";
                let countryCode = (cols[1]?.querySelector(".flag-icon")?.classList.value.match(/flag-icon-([a-z]{2})/)?.[1] || "").toUpperCase();
                let kills = parseInt(cols[3]?.innerText, 10) || 0;
                let deaths = parseInt(cols[4]?.innerText, 10) || 0;

                players.push({ name: rawName, kills, deaths, flag: c2e(countryCode), team });
            });
            return players;
        };

        const ctPlayers = getPlayers(".scoreboard-hud-ct-body tr", "CT");
        const trPlayers = getPlayers(".scoreboard-hud-tr-body tr", "TR");

        // Determine match ID
        function sendPayload(matchId) {
            const payload = {
                data: {
                    Map: mapName,
                    Half: halfLabel,
                    "CT Score": ctScore,
                    "TR Score": trScore,
                    "Players JSON": JSON.stringify([...ctPlayers, ...trPlayers]),
                    Date: new Date().toLocaleDateString("en-US"),
                    "Match ID": matchId
                }
            };

            log("Sending payload:", payload);
            showMsg("Sending to SheetDB...", "lightblue");

            GM_xmlhttpRequest({
                method: "POST",
                url: SHEETDB_API_URL,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(payload),
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300) {
                        log("Sent to SheetDB successfully:", res.responseText);
                        showMsg("Scoreboard sent to SheetDB!", "green");
                    } else {
                        err("SheetDB API error:", res.status, res.statusText, res.responseText);
                        let errMsg = `SheetDB error: ${res.status}`;
                        try { errMsg += ` - ${JSON.parse(res.responseText).error}`; } catch (e) { /* ignore */ }
                        showMsg(errMsg, "red");
                    }
                },
                onerror: (error) => {
                    err("Failed to send request to SheetDB (network error):", error);
                    showMsg("Failed to send to SheetDB (network error)!", "red");
                }
            });
        }

        // If no currentMatchId yet, fetch last from SheetDB
        if (currentMatchId === null) {
            fetchLastMatchId((lastId) => {
                // Only increment if sending first half
                currentMatchId = halfLabel === "First Half" ? lastId + 1 : lastId;
                sendPayload(currentMatchId);
            });
        } else {
            // Use existing match ID for second half
            sendPayload(currentMatchId);
        }
    }

    // --- UI ---
    const createSheetDBSettingsUI = () => {
        if (document.getElementById("sbs-modal")) return;

        const modal = Object.assign(document.createElement("div"), { id: "sbs-modal" });
        Object.assign(modal.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%", background: "rgba(0,0,0,.7)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: "10001",
            fontFamily: "Arial,sans-serif"
        });
        const content = Object.assign(document.createElement("div"), {
            innerHTML: `
                <h3 style="margin-top:0;color:#2c8e4f;text-align:center;">SheetDB API Settings</h3>
                <p style="font-size:13px;margin-bottom:15px;color:#ccc;">Enter your SheetDB API URL:</p>
                <input type="url" id="sbs-api-input" placeholder="${CFG.SHEETDB_PREFIX}..." style="width:calc(100% - 20px);padding:10px;margin-bottom:20px;border:1px solid #4f545c;border-radius:4px;background:#40444b;color:#dcddde;font-size:14px;box-sizing:border-box;">
                <div style="display:flex;justify-content:flex-end;gap:10px;">
                    <button id="sbs-clear-btn" style="padding:10px 20px;border:none;border-radius:4px;background:#e74c3c;color:white;cursor:pointer;font-size:14px;transition:background .2s;flex-grow:1;">Clear</button>
                    <button id="sbs-cancel-btn" style="padding:10px 20px;border:none;border-radius:4px;background:#747f8d;color:white;cursor:pointer;font-size:14px;transition:background .2s;flex-grow:1;">Cancel</button>
                    <button id="sbs-save-btn" style="padding:10px 20px;border:none;border-radius:4px;background:#2c8e4f;color:white;cursor:pointer;font-size:14px;transition:background .2s;flex-grow:1;">Save</button>
                </div>
            `,
            style: `background:#2c2f33;padding:25px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,.3);width:450px;max-width:90%;color:#dcddde;`
        });
        modal.appendChild(content);
        document.body.appendChild(modal);

        const input = document.getElementById("sbs-api-input");
        input.value = SHEETDB_API_URL;
        input.focus();

        const stopProp = e => e.stopPropagation();
        ['keydown', 'keyup', 'keypress', 'mousedown', 'click'].forEach(ev => content.addEventListener(ev, stopProp));

        const closeModalAndRemoveListener = () => {
            modal.remove();
            document.removeEventListener('keydown', escKeyListener);
        };

        document.getElementById("sbs-clear-btn").onclick = async () => {
            input.value = ""; SHEETDB_API_URL = "";
            await GM_setValue(CFG.API_URL_KEY, "");
            showMsg("SheetDB URL cleared!", "orange");
            log("SheetDB URL cleared.");
            closeModalAndRemoveListener();
        };

        document.getElementById("sbs-save-btn").onclick = async () => {
            const newUrl = input.value.trim();
            if (newUrl && newUrl.startsWith(CFG.SHEETDB_PREFIX)) {
                SHEETDB_API_URL = newUrl;
                await GM_setValue(CFG.API_URL_KEY, newUrl);
                showMsg("SheetDB URL saved!", "green");
                log("New SheetDB URL saved.");
                closeModalAndRemoveListener();
            } else {
                showMsg(`Invalid URL! Must start with '${CFG.SHEETDB_PREFIX}'`, "red", 5000);
                input.style.borderColor = "red";
            }
        };

        document.getElementById("sbs-cancel-btn").onclick = () => {
            showMsg("Settings cancelled.", "lightgray");
            closeModalAndRemoveListener();
        };
        modal.onclick = (e) => { if (e.target === modal) { showMsg("Settings cancelled.", "lightgray"); closeModalAndRemoveListener(); }};

        const escKeyListener = function(e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                showMsg("Settings cancelled.", "lightgray");
                closeModalAndRemoveListener();
            }
        };
        document.addEventListener('keydown', escKeyListener);
    };

    // --- INIT & HOTKEYS ---
    log("Scoreboard to SheetDB script loaded. Hotkeys: 'P' (First Half), 'K' (Second Half), 'Alt+Shift+S' (Settings).");
    showMsg("SheetDB script loaded (P/K | Alt+Shift+S)", "lightgreen", CFG.MSG_DURATION);
    if (!SHEETDB_API_URL) showMsg("No SheetDB URL set! Use Alt+Shift+S to configure.", "orange", 5000);

    document.addEventListener("keydown", (e) => {
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;
        const isModalOpen = document.getElementById("sbs-modal");

        if (e.altKey && e.shiftKey && e.key.toLowerCase() === "s" && !isModalOpen) {
            e.preventDefault();
            if (document.pointerLockElement) document.exitPointerLock();
            createSheetDBSettingsUI();
            return;
        }

        if (isInputFocused || isModalOpen) return;

        if (e.key.toLowerCase() === "p") {
            e.preventDefault();
            captureAndSend("First Half");
        } else if (e.key.toLowerCase() === "k") {
            e.preventDefault();
            captureAndSend("Second Half");
        }
    });
})();
