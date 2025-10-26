// ==UserScript==
// @name         Scoreboard to Firebase
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Capture Play-CS scoreboard and send it to Firebase Firestore.
// @author       tiger3homs (obbe.00 on discord)
// @match        https://game.play-cs.com/*
// @grant        GM_xmlhttpRequest
// @require      https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js
// @require      https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js
// ==/UserScript==

(async () => {
    'use strict';

    // --- CONFIG & STATE ---
    const CFG = {
        MSG_DURATION: 3000, // Default message duration for UI notifications
        COLLECTION_NAME: "matches" // Firestore collection name
    };

    // --- UTILS ---
    const log = (...a) => console.log("[SBF]", ...a);
    const err = (...a) => console.error("[SBF]", ...a);
    const warn = (...a) => console.warn("[SBF]", ...a);

    // Converts 2-letter country code to emoji flag
    const c2e = (c) => (c && /^[a-zA-Z]{2}$/.test(c)) ? c.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0))) : "🏳️";

    // Displays temporary messages in the corner of the screen
    const showMsg = (msg, color = "white", duration = CFG.MSG_DURATION) => {
        let el = document.getElementById("sbf-msg");
        if (!el) {
            el = document.createElement("div");
            el.id = "sbf-msg";
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


    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyDoo-XND_2HZ3U9zGGkJYTiSriIyKg3e_s",
      authDomain: "play-cs-app.firebaseapp.com",
      projectId: "play-cs-app",
      storageBucket: "play-cs-app.firebasestorage.app",
      messagingSenderId: "468175007775",
      appId: "1:468175007775:web:98597edc9462e8449b252a",
      measurementId: "G-E275SGZTMF"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    log("Firebase initialized.");


    // --- API & SCOREBOARD ---
    // Injects a script to get window.g_PlayerExtraInfo
    const getPlayerExtraInfo = () => new Promise((resolve) => {
        const script = document.createElement('script');
        script.textContent = `
            document.dispatchEvent(new CustomEvent('sbf:playerInfo', {
                detail: window.g_PlayerExtraInfo || null
            }));
        `;
        document.head.appendChild(script);
        document.head.removeChild(script);

        const listener = (e) => {
            document.removeEventListener('sbf:playerInfo', listener);
            resolve(e.detail);
        };
        document.addEventListener('sbf:playerInfo', listener);
    });

    // Fetch last Match Info from Firestore
    async function fetchLastMatchInfo() {
        try {
            const q = db.collection(CFG.COLLECTION_NAME).orderBy("matchId", "desc").limit(1);
            const querySnapshot = await q.get();
            if (querySnapshot.empty) {
                return { id: 0, half: "Second Half" }; // No matches yet
            }
            const lastDoc = querySnapshot.docs[0].data();
            return {
                id: lastDoc.matchId || 0,
                half: lastDoc.half || "Second Half"
            };
        } catch (e) {
            err("Error fetching last match info from Firestore:", e);
            showMsg("Error fetching match info.", "red");
            return { id: 0, half: "Second Half" }; // Default on error
        }
    }

    // Capture scoreboard and send
    async function captureAndSend(half) {
        const playerExtraInfo = await getPlayerExtraInfo();
        if (!playerExtraInfo) {
            warn("Could not retrieve g_PlayerExtraInfo.");
        }

        const sb = document.querySelector(".hud-scoreboard");
        if (!sb) {
            err("Scoreboard element not found.");
            return showMsg("Scoreboard not found!", "red");
        }

        const mapName = sb.querySelector(".map_name")?.innerText.trim() || "Unknown Map";
        const ctScore = parseInt(sb.querySelector(".scoreboard-hud-ct-head span")?.innerText, 10) || 0;
        const trScore = parseInt(sb.querySelector(".scoreboard-hud-tr-head span")?.innerText, 10) || 0;

        const getPlayers = (sel, team, extraInfo) => {
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

                if (extraInfo) {
                    const playerEntry = Object.entries(extraInfo).find(([id, data]) => data.name === cleanedName);
                    if (playerEntry) {
                        playerId = playerEntry[0];
                    }
                }

                if (kills > 0 || deaths > 0) {
                    players.push({ id: playerId, name: cleanedName, kills, deaths, flag: c2e(countryCode), team });
                }
            });
            return players;
        };

        const ctPlayers = getPlayers(".scoreboard-hud-ct-body tr", "CT", playerExtraInfo);
        const trPlayers = getPlayers(".scoreboard-hud-tr-body tr", "TR", playerExtraInfo);

        const lastMatch = await fetchLastMatchInfo();
        let newMatchId;
        const newHalfLabel = half;

        if (newHalfLabel === "First Half") {
            newMatchId = lastMatch.id + 1;
        } else { // Second Half
            newMatchId = (lastMatch.half === "First Half") ? lastMatch.id : lastMatch.id + 1;
        }

        const payload = {
            map: mapName,
            half: newHalfLabel,
            ctScore: ctScore,
            trScore: trScore,
            players: [...ctPlayers, ...trPlayers],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            matchId: newMatchId
        };

        log("Sending payload:", payload);
        showMsg(`Sending ${newHalfLabel} for Match ID ${newMatchId}...`, "lightblue");

        try {
            await db.collection(CFG.COLLECTION_NAME).add(payload);
            log("Sent to Firestore successfully.");
            const successMessage = `${newHalfLabel} sent successfully ✅`;
            showMsg(successMessage, "lime");
        } catch (e) {
            err("Failed to send request to Firestore:", e);
            showMsg("Failed to send to Firebase!", "red");
        }
    }

    // --- INIT & HOTKEYS ---
    log("Scoreboard to Firebase script loaded. Hotkey: 'P' or 'K' to capture.");
    showMsg("Firebase script loaded (P/K)", "lightgreen", CFG.MSG_DURATION);

    document.addEventListener("keydown", (e) => {
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;
        if (isInputFocused) return;

        const key = e.key.toLowerCase();
        if (key === "p") {
            e.preventDefault();
            captureAndSend("First Half");
        } else if (key === "k") {
            e.preventDefault();
            captureAndSend("Second Half");
        }
    });
})();
