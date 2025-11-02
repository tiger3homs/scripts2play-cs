// ==UserScript==
// @name         CS SB to Google Sheet (Apps Script API)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Capture Play-CS scoreboard and send to your Google Sheet via Apps Script API
// @author       tiger3homs (obbe.00 on discord)
// @match        https://game.play-cs.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(async () => {
  'use strict';

  // --- CONFIG ---
  const CFG = {
    API_URL_KEY: "sheetApiUrl",
    SECRET_TOKEN_KEY: "sheetApiSecretToken",
    TRACKER_SERVER_KEY: "trackerServer",
    SOUND_ENABLED_KEY: "soundEnabled",
    MSG_DURATION: 3000,
    DEFAULT_API_URL: "https://script.google.com/macros/s/AKfycbwxKHC_wYY2dz5gZod8nQiOp60lKHRi60HB7rTG15qoAXHd0PrTVFgCzqEJsEDfQ97K/exec",
    NOTIFICATION_SOUND_URL: "https://github.com/lefuturiste/discord-sounds/blob/master/new-message.mp3?raw=true"
  };
  let API_URL = await GM_getValue(CFG.API_URL_KEY) || CFG.DEFAULT_API_URL;
  let SECRET_TOKEN = await GM_getValue(CFG.SECRET_TOKEN_KEY);
  let TRACKER_SERVER = await GM_getValue(CFG.TRACKER_SERVER_KEY);
  let SOUND_ENABLED = await GM_getValue(CFG.SOUND_ENABLED_KEY, false);
  let lastMatchInfo;

  const log = (...a) => console.log("[SBS]", ...a);
  const err = (...a) => console.error("[SBS]", ...a);
  const warn = (...a) => console.warn("[SBS]", ...a);

  const playSound = () => {
      if (!SOUND_ENABLED) return;
      const audio = new Audio(CFG.NOTIFICATION_SOUND_URL);
      audio.play().catch(e => err("Error playing sound:", e));
  };

  // Converts 2-letter country code to emoji flag
  const c2e = (c) => (c && /^[a-zA-Z]{2}$/.test(c)) ? c.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0))) : "🏳️";

  const showMsg = (msg, color = "white", duration = CFG.MSG_DURATION) => {
    let el = document.getElementById("sbs-msg");
    if (!el) {
        el = document.createElement("div");
        el.id = "sbs-msg";
        Object.assign(el.style, {
            position: "fixed",
            top: "10px",
            right: "10px",
            padding: "4px 10px",
            background: "rgba(20, 20, 20, 0.6)",
            borderRadius: "5px",
            zIndex: "10000",
            fontSize: "13px",
            fontFamily: "Arial, sans-serif",
            color: "white",
            transition: "opacity .3s ease-in-out",
            boxShadow: "0 1px 5px rgba(0,0,0,.3)",
            backdropFilter: "blur(10px)",
            webkitBackdropFilter: "blur(10px)"
        });
        document.body.appendChild(el);
    }

    if (typeof msg === 'object' && msg !== null) {
        el.innerHTML = `<strong style="color: ${color};">${msg.title}:</strong> <span>${msg.body}</span>`;
    } else {
        el.innerHTML = `<span style="color: ${color};">${msg}</span>`;
    }

    el.style.opacity = "1";
    clearTimeout(el.hideT);
    el.hideT = setTimeout(() => (el.style.opacity = "0"), duration);
};

  // Injects a script to get window.g_PlayerExtraInfo
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

  // Fetch last match info from your Google Apps Script
  const fetchLastMatchInfo = () => new Promise((resolve) => {
      GM_xmlhttpRequest({
          method: "GET",
          url: `${API_URL}?action=last&token=${SECRET_TOKEN}`,
          onload: (res) => {
              try {
                  const data = JSON.parse(res.responseText);
                  // Resolve with the entire 'last' object or a default structure
                  if (data.last) {
                      resolve(data.last);
                  } else {
                      resolve({ "Match ID": 0, "Half": "Second Half", "Map": null, "Players JSON": "[]" });
                  }
              } catch (e) {
                  err("Error parsing last match info:", e);
                  resolve({ "Match ID": 0, "Half": "Second Half", "Map": null, "Players JSON": "[]" });
              }
          },
          onerror: (e) => {
              err("Error fetching last match info:", e);
              resolve({ "Match ID": 0, "Half": "Second Half", "Map": null, "Players JSON": "[]" });
          }
      });
  });

  const getPlayers = (sb, sel, team, extraInfo) => {
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

  const parseScoreboard = (playerExtraInfo) => {
      const sb = document.querySelector(".hud-scoreboard");
      if (!sb) {
          showMsg({ title: "Error", body: "Scoreboard not found!" }, "red");
          return null;
      }

      return {
          mapName: sb.querySelector(".map_name")?.innerText.trim() || "Unknown",
          ctScore: parseInt(sb.querySelector(".scoreboard-hud-ct-head span")?.innerText, 10) || 0,
          trScore: parseInt(sb.querySelector(".scoreboard-hud-tr-head span")?.innerText, 10) || 0,
          ctPlayers: getPlayers(sb, ".scoreboard-hud-ct-body tr", "CT", playerExtraInfo),
          trPlayers: getPlayers(sb, ".scoreboard-hud-tr-body tr", "TR", playerExtraInfo)
      };
  };

  const prepareSheetData = (scoreboardData, lastMatchInfo) => {
      const { mapName, ctScore, trScore, ctPlayers, trPlayers } = scoreboardData;
      const lastMatchId = parseInt(lastMatchInfo["Match ID"] || 0);

      let nextHalf, nextId;

      // Smarter logic: Check if we are continuing the same match
      // Conditions: Last match exists, was first half, and the map is the same.
      if (lastMatchId > 0 && lastMatchInfo.Half === "First Half" && lastMatchInfo.Map === mapName) {
          nextHalf = "Second Half";
          nextId = lastMatchId;
      } else {
          // Otherwise, start a new match
          nextHalf = "First Half";
          nextId = lastMatchId + 1;
      }

      return {
          Map: mapName,
          Half: nextHalf,
          "CT Score": ctScore,
          "TR Score": trScore,
          "Players JSON": JSON.stringify([...ctPlayers, ...trPlayers]),
          Date: new Date().toLocaleDateString("en-US"),
          "Match ID": nextId,
          "Tracker Server": TRACKER_SERVER || ""
      };
  };

  const sendToGoogleSheet = (data) => new Promise((resolve, reject) => {
      log("Sending to Google Apps Script:", data);
      showMsg({ title: "Sending Data", body: `Sending ${data.Half} for Match ${data["Match ID"]}...` }, "lightblue");

      GM_xmlhttpRequest({
          method: "POST",
          url: API_URL,
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify({ token: SECRET_TOKEN, data }),
          onload: (res) => {
              if (res.status >= 200 && res.status < 300) {
                  showMsg({ title: "Success", body: `Sent ${data.Half} for Match ${data["Match ID"]} successfully!` }, "green");
                  playSound();
                  // After sending, update lastMatchInfo with the data that was just sent.
                  lastMatchInfo = { ...data };
                  updateHalfLabel(lastMatchInfo.Half);
                  resolve();
              } else {
                  showMsg({ title: "Error", body: "Error sending data!" }, "red");
                  err("Error:", res.status, res.responseText);
                  reject(res);
              }
          },
          onerror: (e) => {
              showMsg({ title: "Network Error", body: "Network error while sending!" }, "red");
              err("Network error:", e);
              reject(e);
          }
      });
  });

  // Main capture and send
  async function captureAndSend() {
      if (!SECRET_TOKEN) {
          return showMsg({ title: "Configuration Needed", body: "Secret Token not set. Press Alt+Shift+S to open settings." }, "orange");
      }
      // If last match info isn't loaded yet, fetch it now.
      if (!lastMatchInfo) {
          showMsg({ title: "Initializing", body: "Fetching last match info first..." }, "lightblue", 2000);
          lastMatchInfo = await fetchLastMatchInfo();
      }

      const playerExtraInfo = await getPlayerExtraInfo();
      if (!playerExtraInfo) {
          warn("Could not retrieve g_PlayerExtraInfo.");
      }

      const scoreboardData = parseScoreboard(playerExtraInfo);
      if (!scoreboardData) return;

      const sheetData = prepareSheetData(scoreboardData, lastMatchInfo);
      sendToGoogleSheet(sheetData);
  }


  // --- HALF LABEL UI ---
  const updateHalfLabel = (lastSentHalf) => {
      const displayHalf = lastSentHalf === "First Half" ? "Second Half" : "First Half";
      showMsg({ title: "Next", body: `Ready for ${displayHalf}` }, "lightblue", 15000);
  };

  // --- SETTINGS PANEL ---
  const createSettingsPanel = () => {
      GM_addStyle(`
          #sbs-settings {
              display: none;
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(20, 20, 20, 0.95);
              color: #fff;
              z-index: 10001;
              padding: 0;
              width: 450px;
              font-family: sans-serif;
              border: 1px solid #555;
          }
          #sbs-settings .sbs-header { background: #333; padding: 10px; font-size: 1.2em; text-align: center; }
          #sbs-settings .sbs-content { padding: 20px; }
          #sbs-settings .sbs-row { display: flex; margin-bottom: 12px; align-items: center; }
          #sbs-settings .sbs-row label { flex-basis: 130px; flex-shrink: 0; }
          #sbs-settings .sbs-row input[type="text"],
          #sbs-settings .sbs-row input[type="password"] {
              flex-grow: 1;
              background: #111;
              border: 1px solid #444;
              color: #fff;
              padding: 8px;
              width: 100%;
          }
          #sbs-settings .sbs-footer { background: #333; padding: 10px; text-align: right; }
          #sbs-settings button { background: #555; border: 1px solid #777; color: #fff; padding: 8px 15px; cursor: pointer; }
          #sbs-settings button:hover { background: #666; }
      `);

      const panel = document.createElement("div");
      panel.id = "sbs-settings";
      panel.innerHTML = `
          <div class="sbs-header">Scoreboard Settings</div>
          <div class="sbs-content">
              <div class="sbs-row">
                  <label for="sbs-api-url">API URL:</label>
                  <input type="text" id="sbs-api-url">
              </div>
              <div class="sbs-row">
                  <label for="sbs-secret-token">Secret Token:</label>
                  <input type="password" id="sbs-secret-token">
              </div>
              <div class="sbs-row">
                  <label for="sbs-tracker-server-1">Tracker Server:</label>
                  <input type="text" id="sbs-tracker-server-1" placeholder="e.g., OBBE">
              </div>
              <div class="sbs-row">
                  <label for="sbs-tracker-server-2">Tracker Name:</label>
                  <input type="text" id="sbs-tracker-server-2" placeholder="e.g., GANGS">
              </div>
              <div class="sbs-row">
                  <label for="sbs-sound-enabled">Notification Sound:</label>
                  <input type="checkbox" id="sbs-sound-enabled">
              </div>
          </div>
          <div class="sbs-footer">
              <button id="sbs-save-btn">Save</button>
              <button id="sbs-close-btn" style="margin-left: 10px;">Close</button>
          </div>
      `;
      document.body.appendChild(panel);

      // Stop event propagation to fix typing issue in game environments
      const stopPropagation = e => e.stopPropagation();
      panel.querySelectorAll('input').forEach(input => {
          input.addEventListener('keydown', stopPropagation);
          input.addEventListener('keyup', stopPropagation);
          input.addEventListener('keypress', stopPropagation);
      });

      document.getElementById("sbs-save-btn").addEventListener("click", async () => {
          const newApiUrl = document.getElementById("sbs-api-url").value;
          const newSecretToken = document.getElementById("sbs-secret-token").value;
          const tracker1 = document.getElementById("sbs-tracker-server-1").value.trim();
          const tracker2 = document.getElementById("sbs-tracker-server-2").value.trim();
          const newTrackerServer = [tracker1, tracker2].filter(Boolean).join(', ');
          const newSoundEnabled = document.getElementById("sbs-sound-enabled").checked;

          await GM_setValue(CFG.API_URL_KEY, newApiUrl);
          await GM_setValue(CFG.SECRET_TOKEN_KEY, newSecretToken);
          await GM_setValue(CFG.TRACKER_SERVER_KEY, newTrackerServer);
          await GM_setValue(CFG.SOUND_ENABLED_KEY, newSoundEnabled);

          API_URL = newApiUrl;
          SECRET_TOKEN = newSecretToken;
          TRACKER_SERVER = newTrackerServer;
          SOUND_ENABLED = newSoundEnabled;

          showMsg({ title: "Settings Saved", body: "Your settings have been saved successfully." }, "green");
          panel.style.display = "none";
      });

      document.getElementById("sbs-close-btn").addEventListener("click", () => {
          panel.style.display = "none";
      });

      return panel;
  };

  const settingsPanel = createSettingsPanel();

  const initialize = async () => {
      if (SECRET_TOKEN) {
          lastMatchInfo = await fetchLastMatchInfo();
          log("Last match info loaded:", lastMatchInfo);
          updateHalfLabel(lastMatchInfo.Half);
      } else {
          log("Secret token not set. Skipping initial fetch.");
      }
      // No longer starting observer.
  };

    // --- HOTKEYS ---
    log("Loaded. Press P or K to send scoreboard. Press Alt+Shift+S (or Cmd+Shift+S on mac) for settings.");
    showMsg({ title: "Script Loaded", body: "Google Sheet script loaded (P/K). Settings: Alt/Cmd+Shift+S" }, "lightgreen");

  document.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      // Accept Alt+Shift+S on Windows/Linux and Option(Alt)+Shift+S or Cmd+Shift+S on macOS.
      if ((e.altKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          const apiUrlInput = document.getElementById("sbs-api-url");
          const secretTokenInput = document.getElementById("sbs-secret-token");
          const trackerServer1Input = document.getElementById("sbs-tracker-server-1");
          const trackerServer2Input = document.getElementById("sbs-tracker-server-2");
          const soundEnabledInput = document.getElementById("sbs-sound-enabled");

          if (apiUrlInput) apiUrlInput.value = API_URL || CFG.DEFAULT_API_URL;
          if (secretTokenInput) secretTokenInput.value = SECRET_TOKEN || '';
          if (trackerServer1Input && trackerServer2Input) {
              const [part1 = '', part2 = ''] = (TRACKER_SERVER || '').split(', ');
              trackerServer1Input.value = part1;
              trackerServer2Input.value = part2;
          }
          if (soundEnabledInput) soundEnabledInput.checked = SOUND_ENABLED;

          settingsPanel.style.display = "block";
      } else if (e.key.toLowerCase() === "p" || e.key.toLowerCase() === "k") {
          e.preventDefault();
          captureAndSend();
      }
  });

  initialize();
})();
