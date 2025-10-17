// ==UserScript==
// @name         Scoreboard to Discord (Embed) - Player Tracking & UI
// @namespace    http://tampermonkey.net/
// @version      2.8 // Minor version bump for tracking toggle and refinements
// @description  Skicka scoreboard från Play-CS till Discord webhook med embed, bypass CORS, UI för webhook-hantering och bakgrunds-spelaretracking.
// @author       tiger3homs (obbe.00 on discord)
// @match        https://game.play-cs.com/*
// @icon         https://play-cs.com/img/favicon.png
// @connect      discord.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async () => {
    'use strict';

    // --- CONFIG & STATE ---
    const CFG = {
        WEBHOOK_KEY: "discordWebhookUrl",
        PLAYER_TRACK_INT: 2000, // Player tracking interval (2 seconds)
        PLAYER_CLEAN_INT: 3600000, // Player cleanup interval (1 hour)
        MSG_DURATION: 3000, // Default message duration for UI notifications
        WEBHOOK_PREFIX: "https://discord.com/api/webhooks/",
        RESET_THRESHOLD: 0.5 // If current K/D is less than this ratio of last seen, consider it a reset
    };
    let WEBHOOK_URL = await GM_getValue(CFG.WEBHOOK_KEY) || "";

    // Stores accumulated stats for players.
    // The key is now the cleaned player name for persistent tracking.
    // { cleanedName: { id, n, tk, td, s, c, lsk, lsd, lu } }
    // id: The 'id' from g_PlayerExtraInfo, updated each scan.
    // n: original (or cleaned) name for display.
    // tk: totalKills, td: totalDeaths, s: skill, c: countryCode (2-letter),
    // lsk: lastSeenKills (from current scoreboard state), lsd: lastSeenDeaths (from current scoreboard state),
    // lu: lastUpdateTime
    const trackedPlayers = {};

    let isTrackingEnabled = true; // Player tracking starts enabled by default
    let playerTrackingIntervalId = null;
    let playerCleanupIntervalId = null;

    // --- UTILS ---
    const log = (...a) => console.log("[SBD]", ...a);
    const err = (...a) => console.error("[SBD]", ...a);
    const warn = (...a) => console.warn("[SBD]", ...a);

    // Converts 2-letter country code to emoji flag
    const c2e = (c) => (c && /^[a-zA-Z]{2}$/.test(c)) ? c.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0))) : "🏳️";

    // Displays temporary messages in the corner of the screen
    const showMsg = (msg, color = "white", duration = CFG.MSG_DURATION) => {
        let el = document.getElementById("sbd-msg");
        if (!el) {
            el = document.createElement("div");
            el.id = "sbd-msg";
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

    // --- PLAYER TRACKING ---
    const updatePlayerStats = () => {
        const pE = window.g_PlayerExtraInfo;
        if (!pE || !Object.keys(pE).length) return; // No player info available

        const now = Date.now();
        const currentActivePlayerNames = new Set(); // To detect who is currently in the game

        for (const id in pE) { // Iterate through all players currently reported by the game
            const gp = pE[id];
            const rawName = gp.name || "";
            const cleanedName = rawName.replace(/^(\[.*?\]|<.*?>|\(.*?\))\s*/, '').trim() || rawName;

            if (!cleanedName) continue;

            currentActivePlayerNames.add(cleanedName.toLowerCase());

            const ck = parseInt(gp.frags, 10) || 0;
            const cd = parseInt(gp.deaths, 10) || 0;
            const s = parseFloat(gp.skill) || 0;

            const existingPlayer = trackedPlayers[cleanedName.toLowerCase()];

            if (!existingPlayer) {
                trackedPlayers[cleanedName.toLowerCase()] = {
                    id: id,
                    n: rawName, // Store raw name for display purposes if needed, cleaned name is the key
                    tk: ck, td: cd, s, c: "", lsk: ck, lsd: cd, lu: now
                };
                log(`New player "${rawName}" (cleaned: "${cleanedName}", ID:${id}) added to tracking.`);
            } else {
                const idChanged = existingPlayer.id !== id;
                const isKillsReset = (ck < existingPlayer.lsk && ck < (existingPlayer.lsk * CFG.RESET_THRESHOLD));
                const isDeathsReset = (cd < existingPlayer.lsd && cd < (existingPlayer.lsd * CFG.RESET_THRESHOLD));

                if (idChanged || isKillsReset || isDeathsReset) {
                    log(`Player "${existingPlayer.n}" (cleaned: "${cleanedName}", old ID:${existingPlayer.id}, new ID:${id}) stats/ID changed (reconnected/new game). Resetting 'last seen' values. K/D: ${existingPlayer.lsk}/${existingPlayer.lsd} -> ${ck}/${cd}`);
                    existingPlayer.lsk = ck;
                    existingPlayer.lsd = cd;
                    existingPlayer.id = id; // Update to the new ID
                    // Update raw name in case it changed too
                    existingPlayer.n = rawName;
                } else {
                    existingPlayer.tk += (ck - existingPlayer.lsk);
                    existingPlayer.td += (cd - existingPlayer.lsd);
                    existingPlayer.tk = Math.max(0, existingPlayer.tk);
                    existingPlayer.td = Math.max(0, existingPlayer.td);

                    existingPlayer.lsk = ck;
                    existingPlayer.lsd = cd;
                }

                existingPlayer.s = s;
                existingPlayer.lu = now;
            }
        }
    };

    const cleanupOldPlayers = () => {
        const now = Date.now();
        for (const cleanedNameKey in trackedPlayers) {
            if (now - trackedPlayers[cleanedNameKey].lu > CFG.PLAYER_CLEAN_INT) {
                log(`Cleaning up old player: "${trackedPlayers[cleanedNameKey].n}" (cleaned: "${cleanedNameKey}") due to inactivity.`);
                delete trackedPlayers[cleanedNameKey];
            }
        }
    };

    const startPlayerTracking = () => {
        if (!playerTrackingIntervalId) {
            playerTrackingIntervalId = setInterval(updatePlayerStats, CFG.PLAYER_TRACK_INT);
            playerCleanupIntervalId = setInterval(cleanupOldPlayers, CFG.PLAYER_CLEAN_INT);
            isTrackingEnabled = true;
            showMsg("Player tracking STARTED.", "lime");
            log("Player tracking started.");
        }
    };

    const stopPlayerTracking = () => {
        if (playerTrackingIntervalId) {
            clearInterval(playerTrackingIntervalId);
            clearInterval(playerCleanupIntervalId);
            playerTrackingIntervalId = null;
            playerCleanupIntervalId = null;
            isTrackingEnabled = false;
            showMsg("Player tracking STOPPED.", "orange");
            log("Player tracking stopped.");
        }
    };

    // --- SCOREBOARD & DISCORD ---
    const captureAndSendScoreboard = (footerInfo = "Match Info") => {
        log("Capturing scoreboard...");
        if (!WEBHOOK_URL) {
            warn("Webhook URL not set. Use Alt+Shift+D.");
            return showMsg("Webhook URL not set! Press Alt+Shift+D to configure.", "orange", 5000);
        }

        const sb = document.querySelector(".hud-scoreboard");
        if (!sb) {
            err("Scoreboard element not found.");
            return showMsg("Scoreboard not found!", "red");
        }

        const mapNameEl = sb.querySelector(".map_name");
        if (!mapNameEl) {
            warn("Map name element not found in scoreboard.");
        }
        const mapName = mapNameEl?.innerText.trim() || "Unknown Map";

        const ctScoreEl = sb.querySelector(".scoreboard-hud-ct-head span");
        const trScoreEl = sb.querySelector(".scoreboard-hud-tr-head span");
        if (!ctScoreEl || !trScoreEl) {
             warn("Team score elements not found in scoreboard.");
        }
        const ctScore = parseInt(ctScoreEl?.innerText, 10) || 0;
        const trScore = parseInt(trScoreEl?.innerText, 10) || 0;

        showMsg("Capturing scoreboard...", "lightblue");

        const getPlayers = (sel) => {
            const players = [];
            const playerRows = sb.querySelectorAll(sel);
            if (!playerRows.length) {
                warn(`No player rows found for selector: ${sel}`);
                return players;
            }

            playerRows.forEach(row => {
                try {
                    const cols = row.querySelectorAll("td");
                    if (cols.length < 5) return;

                    let rawName = cols[1]?.innerText.trim() || "Unknown";
                    let cleanedName = rawName.replace(/^(\[.*?\]|<.*?>|\(.*?\))\s*/, '').trim() || rawName;
                    let countryCodeFromSB = (cols[1]?.querySelector(".flag-icon")?.classList.value.match(/flag-icon-([a-z]{2})/)?.[1] || "").toUpperCase();

                    let foundPlayerStats = trackedPlayers[cleanedName.toLowerCase()];

                    let killsToSend, deathsToSend, finalCountryFlagEmoji;

                    if (foundPlayerStats) {
                        killsToSend = foundPlayerStats.tk;
                        deathsToSend = foundPlayerStats.td;

                        if (countryCodeFromSB && !foundPlayerStats.c) {
                            foundPlayerStats.c = countryCodeFromSB;
                            log(`Updated country code for ${foundPlayerStats.n} to ${countryCodeFromSB}`);
                        }
                        finalCountryFlagEmoji = c2e(foundPlayerStats.c);
                    } else {
                        killsToSend = parseInt(cols[3]?.innerText, 10) || 0;
                        deathsToSend = parseInt(cols[4]?.innerText, 10) || 0;
                        finalCountryFlagEmoji = c2e(countryCodeFromSB);
                    }

                    if (killsToSend > 0 || deathsToSend > 0) {
                        players.push({ n: cleanedName, k: killsToSend, d: deathsToSend, f: finalCountryFlagEmoji });
                    }
                } catch (e) {
                    warn("Error parsing player row in scoreboard capture:", e);
                }
            });
            return players;
        };

        const ctP = getPlayers(".scoreboard-hud-ct-body tr");
        const trP = getPlayers(".scoreboard-hud-tr-body tr");

        const formatP = (ps) => ps.sort((a, b) => b.k - a.k).map(p => `${p.f} **${p.n}** — ${p.k}/${p.d}`).join("\n") || "No players found.";

        const embed = {
            title: mapName,
            description: `**Score:** 🔵 ${ctScore} — 🔴 ${trScore}`,
            color: (ctScore > trScore ? 0x3498db : (trScore > ctScore ? 0xe74c3c : 0x95a5a6)),
            fields: [
                { name: "CT", value: formatP(ctP), inline: true },
                { name: "TR", value: formatP(trP), inline: true }
            ],
            footer: { text: `${footerInfo} | ${new Date().toLocaleDateString('en-US')}` },
        };

        GM_xmlhttpRequest({
            method: "POST",
            url: WEBHOOK_URL,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ embeds: [embed] }),
            onload: (res) => {
                if (res.status >= 200 && res.status < 300) {
                    log("Scoreboard sent to Discord successfully!");
                    showMsg("Scoreboard sent to Discord!", "green");
                } else {
                    err("Discord API error:", res.status, res.statusText, res.responseText);
                    let errMsg = `Discord error: ${res.status}`;
                    try { errMsg += ` - ${JSON.parse(res.responseText).message}`; } catch (e) { /* ignore parse error if response is not JSON */ }
                    showMsg(errMsg, "red");
                }
            },
            onerror: (err) => {
                err("Failed to send request to Discord (network error):", err);
                showMsg("Failed to send scoreboard to Discord (network error)!", "red");
            }
        });
    };

    // --- UI ---
    const createWebhookSettingsUI = () => {
        if (document.getElementById("sbd-modal")) return;

        const modal = Object.assign(document.createElement("div"), { id: "sbd-modal" });
        Object.assign(modal.style, {
            position: "fixed", top: "0", left: "0", width: "100%", height: "100%", background: "rgba(0,0,0,.7)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: "10001",
            fontFamily: "Arial,sans-serif"
        });
        const content = Object.assign(document.createElement("div"), {
            innerHTML: `
                <h3 style="margin-top:0;color:#7289da;text-align:center;">Discord Webhook Settings</h3>
                <p style="font-size:13px;margin-bottom:15px;color:#ccc;">Enter your Discord webhook URL:</p>
                <input type="url" id="sbd-webhook-input" placeholder="${CFG.WEBHOOK_PREFIX}..." style="width:calc(100% - 20px);padding:10px;margin-bottom:20px;border:1px solid #4f545c;border-radius:4px;background:#40444b;color:#dcddde;font-size:14px;box-sizing:border-box;">
                <div style="display:flex;justify-content:flex-end;gap:10px;">
                    <button id="sbd-clear-btn" style="padding:10px 20px;border:none;border-radius:4px;background:#e74c3c;color:white;cursor:pointer;font-size:14px;transition:background .2s;flex-grow:1;">Clear</button>
                    <button id="sbd-cancel-btn" style="padding:10px 20px;border:none;border-radius:4px;background:#747f8d;color:white;cursor:pointer;font-size:14px;transition:background .2s;flex-grow:1;">Cancel</button>
                    <button id="sbd-save-btn" style="padding:10px 20px;border:none;border-radius:4px;background:#7289da;color:white;cursor:pointer;font-size:14px;transition:background .2s;flex-grow:1;">Save</button>
                </div>
            `,
            style: `background:#2c2f33;padding:25px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,.3);width:450px;max-width:90%;color:#dcddde;`
        });
        modal.appendChild(content);
        document.body.appendChild(modal);

        const input = document.getElementById("sbd-webhook-input");
        input.value = WEBHOOK_URL;
        input.focus();

        const stopProp = e => e.stopPropagation();
        ['keydown', 'keyup', 'keypress', 'mousedown', 'click'].forEach(ev => content.addEventListener(ev, stopProp));

        document.getElementById("sbd-clear-btn").onclick = async () => {
            input.value = ""; WEBHOOK_URL = "";
            await GM_setValue(CFG.WEBHOOK_KEY, "");
            showMsg("Webhook URL cleared!", "orange");
            log("Webhook URL cleared.");
            closeModalAndRemoveListener();
        };

        document.getElementById("sbd-save-btn").onclick = async () => {
            const newUrl = input.value.trim();
            if (newUrl && newUrl.startsWith(CFG.WEBHOOK_PREFIX)) {
                WEBHOOK_URL = newUrl;
                await GM_setValue(CFG.WEBHOOK_KEY, newUrl);
                showMsg("Webhook URL saved!", "green");
                log("New Webhook URL saved.");
                closeModalAndRemoveListener();
            } else {
                showMsg(`Invalid URL! Must start with '${CFG.WEBHOOK_PREFIX}'`, "red", 5000);
                input.style.borderColor = "red";
            }
        };

        const closeModalAndRemoveListener = () => {
            modal.remove();
            // Only show "Settings cancelled" if it wasn't a save/clear operation
            if (!input.value.startsWith(CFG.WEBHOOK_PREFIX) && WEBHOOK_URL) { // Check if an old URL existed and wasn't replaced
                showMsg("Settings cancelled.", "lightgray");
            } else if (!input.value && !WEBHOOK_URL) { // If input cleared and webhook also cleared
                 // Do nothing, showMsg from clear button is enough
            }
            document.removeEventListener('keydown', escKeyListener);
        };

        document.getElementById("sbd-cancel-btn").onclick = closeModalAndRemoveListener;
        modal.onclick = (e) => { if (e.target === modal) closeModalAndRemoveListener(); };

        const escKeyListener = function(e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                closeModalAndRemoveListener();
            }
        };
        document.addEventListener('keydown', escKeyListener);
    };

    // --- INIT ---
    log("Scoreboard to Discord script loaded. Hotkeys: 'P' (First Half), 'K' (Second Half), 'Alt+S' (Toggle Tracking), 'Alt+Shift+D' (Settings).");
    showMsg("Scoreboard script loaded (P/K | Alt+S | Alt+Shift+D)", "lightgreen", CFG.MSG_DURATION);
    if (!WEBHOOK_URL) showMsg("No Webhook URL set! Use Alt+Shift+D to configure.", "orange", 5000);

    // Start background player tracking and cleanup intervals initially
    startPlayerTracking();

    // Global hotkey listener
    document.addEventListener("keydown", (e) => {
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;
        const isModalOpen = document.getElementById("sbd-modal");

        // Allow Alt+Shift+D to open settings even if an input is focused, but not if modal is already open
        if (e.altKey && e.shiftKey && e.key.toLowerCase() === "d" && !isModalOpen) {
            e.preventDefault();
            if (document.pointerLockElement) document.exitPointerLock(); // Exit pointer lock if active
            createWebhookSettingsUI();
            return; // Consume the event
        }

        // Prevent other hotkeys if an input is focused or modal is open
        if (isInputFocused || isModalOpen) {
            return;
        }

        // Hotkeys for general use
        if (e.altKey && e.key.toLowerCase() === "s") {
            e.preventDefault();
            if (isTrackingEnabled) {
                stopPlayerTracking();
            } else {
                startPlayerTracking();
            }
        } else if (e.key.toLowerCase() === "p") {
            e.preventDefault();
            captureAndSendScoreboard("First Half");
        } else if (e.key.toLowerCase() === "k") {
            e.preventDefault();
            captureAndSendScoreboard("Second Half");
        }
    });
})();