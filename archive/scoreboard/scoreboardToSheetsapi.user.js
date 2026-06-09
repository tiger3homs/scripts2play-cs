// ==UserScript==
// @name         0Scoreboard to Google Sheet (Apps Script API)
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
    MSG_DURATION: 3000,
    DEFAULT_API_URL: "https://script.google.com/macros/s/AKfycbwxKHC_wYY2dz5gZod8nQiOp60lKHRi60HB7rTG15qoAXHd0PrTVFgCzqEJsEDfQ97K/exec"
  };
  let API_URL = await GM_getValue(CFG.API_URL_KEY) || CFG.DEFAULT_API_URL;
  let SECRET_TOKEN = await GM_getValue(CFG.SECRET_TOKEN_KEY);
  let lastMatchInfo;
  let teamsSwapped = false; // Track if sides have been swapped

  const log = (...a) => console.log("[SBS]", ...a);
  const err = (...a) => console.error("[SBS]", ...a);
  const warn = (...a) => console.warn("[SBS]", ...a);

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
            padding: "10px 18px",
            background: "rgba(0,0,0,.8)",
            borderRadius: "8px",
            zIndex: "10000",
            fontSize: "14px",
            fontFamily: "Arial, sans-serif",
            color: "white",
            transition: "opacity .3s ease-in-out",
            boxShadow: "0 2px 10px rgba(0,0,0,.5)"
        });
        document.body.appendChild(el);
    }

    if (typeof msg === 'object' && msg !== null) {
        el.innerHTML = `<strong style="display: block; margin-bottom: 5px; font-size: 16px; color: ${color};">${msg.title}</strong><span style="font-size: 13px;">${msg.body}</span>`;
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
                  const last = data.last || {};
                  resolve({
                      id: parseInt(last["Match ID"] || 0),
                      half: last["Half"] || "Second Half"
                  });
              } catch (e) {
                  err("Error parsing last match info:", e);
                  resolve({ id: 0, half: "Second Half" });
              }
          },
          onerror: (e) => {
              err("Error fetching last match info:", e);
              resolve({ id: 0, half: "Second Half" });
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

      let nextHalf, nextId;

      if (lastMatchInfo.id > 0) {
          // Existing matches, determine next half and ID
          if (lastMatchInfo.half === "First Half") {
              nextHalf = "Second Half";
              nextId = lastMatchInfo.id;
          } else { // Second Half or other
              nextHalf = "First Half";
              nextId = lastMatchInfo.id + 1;
          }
      } else {
          // No previous match found, start a new one
          nextHalf = "First Half";
          nextId = 1;
      }

      return {
          Map: mapName,
          Half: nextHalf,
          "CT Score": ctScore,
          "TR Score": trScore,
          "Players JSON": JSON.stringify([...ctPlayers, ...trPlayers]),
          Date: new Date().toLocaleDateString("en-US"),
          "Match ID": nextId
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
                  showMsg({ title: "Success", body: "Sent to Google Sheet successfully!" }, "green");
                  lastMatchInfo = { id: data["Match ID"], half: data.Half };
                  updateHalfLabel(lastMatchInfo.half);
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
          return showMsg({ title: "Configuration Needed", body: "Secret Token not set. Press Shift+S to open settings." }, "orange");
      }
      if (!lastMatchInfo) {
          return showMsg({ title: "Data Missing", body: "Last match info not available. Retrying..." }, "orange", async () => {
              lastMatchInfo = await fetchLastMatchInfo();
          });
      }

      const playerExtraInfo = await getPlayerExtraInfo();
      if (!playerExtraInfo) {
          warn("Could not retrieve g_PlayerExtraInfo.");
      }

      const scoreboardData = parseScoreboard(playerExtraInfo);
      if (!scoreboardData) return;

      // Handle side swap dynamically
      let finalScoreboardData = { ...scoreboardData };
      if (teamsSwapped) {
          log("Teams are swapped, flipping scores and players for reporting.");
          // Create new arrays and objects to avoid mutation issues
          const newCtPlayers = JSON.parse(JSON.stringify(scoreboardData.trPlayers));
          const newTrPlayers = JSON.parse(JSON.stringify(scoreboardData.ctPlayers));

          newCtPlayers.forEach(p => p.team = "CT");
          newTrPlayers.forEach(p => p.team = "TR");

          finalScoreboardData = {
              ...scoreboardData,
              ctScore: scoreboardData.trScore,
              trScore: scoreboardData.ctScore,
              ctPlayers: newCtPlayers,
              trPlayers: newTrPlayers
          };
      }

      const sheetData = prepareSheetData(finalScoreboardData, lastMatchInfo);
      sendToGoogleSheet(sheetData);
  }

  // --- AUTO-SEND LOGIC ---
  let autoSendDebounceTimer;

  // Helper function for auto-triggered sends to avoid code duplication
  async function sendDataForAutoTrigger(matchId, half) {
      if (!SECRET_TOKEN) {
          return showMsg({ title: "Configuration Needed", body: "Secret Token not set." }, "orange");
      }

      const playerExtraInfo = await getPlayerExtraInfo();
      const scoreboardData = parseScoreboard(playerExtraInfo);
      if (!scoreboardData) return;

      // Handle side swap dynamically
      let finalScoreboardData = { ...scoreboardData };
      if (teamsSwapped) {
          log("Teams are swapped, flipping scores and players for reporting.");
          const newCtPlayers = JSON.parse(JSON.stringify(scoreboardData.trPlayers));
          const newTrPlayers = JSON.parse(JSON.stringify(scoreboardData.ctPlayers));
          newCtPlayers.forEach(p => p.team = "CT");
          newTrPlayers.forEach(p => p.team = "TR");
          finalScoreboardData = {
              ...scoreboardData,
              ctScore: scoreboardData.trScore,
              trScore: scoreboardData.ctScore,
              ctPlayers: newCtPlayers,
              trPlayers: newTrPlayers
          };
      }

      const sheetData = {
          Map: finalScoreboardData.mapName,
          Half: half,
          "CT Score": finalScoreboardData.ctScore,
          "TR Score": finalScoreboardData.trScore,
          "Players JSON": JSON.stringify([...finalScoreboardData.ctPlayers, ...finalScoreboardData.trPlayers]),
          Date: new Date().toLocaleDateString("en-US"),
          "Match ID": matchId
      };

      await sendToGoogleSheet(sheetData);
  }

  async function checkAndAutoSend() {
      const scoreboardData = parseScoreboard();
      if (!scoreboardData) return;

      const { ctScore, trScore } = scoreboardData;
      const lastInfo = await fetchLastMatchInfo();

      // Determine the current state based on the last entry in the sheet
      const inSecondHalf = lastInfo.id > 0 && lastInfo.half === "First Half";
      const isNewMatch = !inSecondHalf;
      const currentMatchId = isNewMatch ? (lastInfo.id || 0) + 1 : lastInfo.id;

      // State 1: We are in the second half of an ongoing match
      if (inSecondHalf) {
          // Condition: Match ends when a team reaches 16
          if (ctScore === 16 || trScore === 16) {
              log("Match end condition met (score is 16).");
              showMsg({ title: "Match Ended", body: "Auto-sending final data..." }, "lightblue");
              await sendDataForAutoTrigger(currentMatchId, "Match Ended");
          }
      }
      // State 2: We are in the first half of a new match
      else {
          // Condition: First half ends when total score is 15
          if (ctScore + trScore === 15) {
              log("First half end condition met (total score is 15).");
              showMsg({ title: "First Half Ended", body: "Auto-sending data..." }, "lightblue");
              await sendDataForAutoTrigger(currentMatchId, "First Half");
          }
      }
  }

  const scoreboardObserver = new MutationObserver(() => {
      clearTimeout(autoSendDebounceTimer);
      // Debounce to avoid rapid firing during score updates.
      autoSendDebounceTimer = setTimeout(checkAndAutoSend, 1000);
  });

  function startScoreboardObserver() {
      const scoreboardNode = document.querySelector(".hud-scoreboard");
      if (scoreboardNode) {
          // We observe the score containers specifically for changes.
          const ctScoreNode = scoreboardNode.querySelector(".scoreboard-hud-ct-head span");
          const trScoreNode = scoreboardNode.querySelector(".scoreboard-hud-tr-head span");

          if (ctScoreNode && trScoreNode) {
              scoreboardObserver.observe(ctScoreNode, { characterData: true, childList: true, subtree: true });
              scoreboardObserver.observe(trScoreNode, { characterData: true, childList: true, subtree: true });
              log("Scoreboard observer started.");
          } else {
              warn("Score elements not found, retrying observer setup...");
              setTimeout(startScoreboardObserver, 2000);
          }
      } else {
          // If scoreboard isn't there, wait and try again.
          setTimeout(startScoreboardObserver, 2000);
      }
  }

  // --- HALF LABEL UI ---
  const createHalfLabel = () => {
      GM_addStyle(`
          #sbs-half-label {
              position: fixed;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              padding: 8px 16px;
              background: rgba(0,0,0,.7);
              color: white;
              border-radius: 8px;
              z-index: 9999;
              font-size: 16px;
              font-family: 'Arial', sans-serif;
              font-weight: bold;
              box-shadow: 0 2px 8px rgba(0,0,0,.4);
              transition: opacity .3s;
              opacity: 0; /* Start hidden */
          }
      `);
      const label = document.createElement("div");
      label.id = "sbs-half-label";
      document.body.appendChild(label);
      return label;
  };

  const halfLabel = createHalfLabel();

  const updateHalfLabel = (lastSentHalf) => {
      if (halfLabel) {
          // If the last sent data was for the "First Half", we are now in the "Second Half".
          // If the last sent data was for the "Second Half", the next match will be "First Half".
          const displayHalf = lastSentHalf === "First Half" ? "Second Half" : "First Half";
          halfLabel.textContent = displayHalf;
          halfLabel.style.opacity = "1";
      }
  };

  // --- SETTINGS PANEL ---
  const createSettingsPanel = () => {
      GM_addStyle(`
          #sbs-settings { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2c2c2c; color: white; padding: 20px; border-radius: 8px; z-index: 10001; box-shadow: 0 0 15px rgba(0,0,0,.5); }
          #sbs-settings h2 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; }
          #sbs-settings label { display: block; margin: 10px 0 5px; }
          #sbs-settings input { width: 100%; padding: 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px; }
          #sbs-settings button { padding: 10px 15px; border: none; background: #4CAF50; color: white; border-radius: 4px; cursor: pointer; margin-top: 15px; }
          #sbs-settings .close-btn { background: #f44336; float: right; }
      `);

      const panel = document.createElement("div");
      panel.id = "sbs-settings";
      panel.innerHTML = `
          <h2>Scoreboard Sender Settings</h2>
          <label for="sbs-api-url">API URL:</label>
          <input type="text" id="sbs-api-url" value="${API_URL}">
          <label for="sbs-secret-token">Secret Token:</label>
          <input type="password" id="sbs-secret-token" value="${SECRET_TOKEN || ''}">
          <button id="sbs-save-btn">Save</button>
          <button id="sbs-close-btn" class="close-btn">Close</button>
      `;
      document.body.appendChild(panel);

      document.getElementById("sbs-save-btn").addEventListener("click", async () => {
          const newApiUrl = document.getElementById("sbs-api-url").value;
          const newSecretToken = document.getElementById("sbs-secret-token").value;

          await GM_setValue(CFG.API_URL_KEY, newApiUrl);
          await GM_setValue(CFG.SECRET_TOKEN_KEY, newSecretToken);

          API_URL = newApiUrl;
          SECRET_TOKEN = newSecretToken;

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
          updateHalfLabel(lastMatchInfo.half);
      } else {
          log("Secret token not set. Skipping initial fetch.");
      }
      // Start the observer to automatically detect the end of the first half.
      startScoreboardObserver();
  };

  // --- HOTKEYS ---
  log("Loaded. Press P or K to send scoreboard. Press Shift+S for settings.");
  showMsg({ title: "Script Loaded", body: "Google Sheet script loaded (P/K)" }, "lightgreen");

  document.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      if (e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          settingsPanel.style.display = "block";
      } else if (e.key.toLowerCase() === "p" || e.key.toLowerCase() === "k") {
          e.preventDefault();
          captureAndSend();
      }
  });

  // --- CHAT MONITOR: Detect /swap or "Teams swapped!" ---
  const initChatObserver = () => {
      const chatContainer = document.querySelector(".hud-chat-messages");
      if (chatContainer) {
          const observer = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                  mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1 && node.classList.contains("hud-chat-message")) {
                          const text = node.innerText.toLowerCase();
                          if (text.includes("/swap") || text.includes("teams swapped")) {
                              teamsSwapped = !teamsSwapped;
                              log(`🔁 Teams swapped detected! teamsSwapped = ${teamsSwapped}`);
                              showMsg(`🔁 Teams swapped! (Sides are now flipped)`, "lightblue", 4000);
                          }
                      }
                  });
              }
          });
          observer.observe(chatContainer, { childList: true, subtree: true });
          log("Chat observer initialized — listening for /swap or 'Teams swapped!'");
      } else {
          warn("Chat container not found — cannot detect /swap. Retrying...");
          setTimeout(initChatObserver, 2000); // Retry if chat is not loaded yet
      }
  };

  initialize();
  initChatObserver();
})();
