// ==UserScript==
// @name         Scoreboard to Google Sheet (Apps Script API)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Capture Play-CS scoreboard and send to your Google Sheet via Apps Script API
// @author       tiger3homs (obbe.00 on discord)
// @match        https://game.play-cs.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async () => {
  'use strict';

  // --- CONFIG ---
  const CFG = {
    API_URL_KEY: "sheetApiUrl",
    MSG_DURATION: 3000,
    DEFAULT_API_URL: "https://script.google.com/macros/s/AKfycby8P8oJ8DOEsn648EkHa5y8FftDFpqXswpLtHSeGzUxT4lcdPbdbBeWHo90sWgTc5H5/exec",
    SECRET_TOKEN: "b1a2d3e4-f5a6-4b7c-8d9e-0123456789ab"
  };
  let API_URL = await GM_getValue(CFG.API_URL_KEY) || CFG.DEFAULT_API_URL;

  const log = (...a) => console.log("[SBS]", ...a);
  const showMsg = (msg, color = "white", duration = CFG.MSG_DURATION) => {
    let el = document.getElementById("sbs-msg");
    if (!el) {
      el = document.createElement("div");
      el.id = "sbs-msg";
      Object.assign(el.style, {
        position: "fixed",
        top: "10px",
        right: "10px",
        padding: "8px 15px",
        background: "rgba(0,0,0,.7)",
        borderRadius: "5px",
        zIndex: "10000",
        fontSize: "14px",
        fontFamily: "Arial,sans-serif",
        color,
        transition: "opacity .3s ease-in-out"
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el.hideT);
    el.hideT = setTimeout(() => (el.style.opacity = "0"), duration);
  };

  // Fetch last match info from your Google Apps Script
  function fetchLastMatchInfo(callback) {
    GM_xmlhttpRequest({
      method: "GET",
      url: `${API_URL}?action=last&token=${CFG.SECRET_TOKEN}`,
      onload: (res) => {
        try {
          const data = JSON.parse(res.responseText);
          const last = data.last || {};
          callback({
            id: parseInt(last["Match ID"] || 0),
            half: last["Half"] || "Second Half"
          });
        } catch (e) {
          console.error("Error parsing last match info:", e);
          callback({ id: 0, half: "Second Half" });
        }
      },
      onerror: (e) => {
        console.error("Error fetching last match info:", e);
        callback({ id: 0, half: "Second Half" });
      }
    });
  }

  // Main capture and send
  async function captureAndSend() {
    const sb = document.querySelector(".hud-scoreboard");
    if (!sb) return showMsg("Scoreboard not found!", "red");

    const mapName = sb.querySelector(".map_name")?.innerText.trim() || "Unknown";
    const ctScore = parseInt(sb.querySelector(".scoreboard-hud-ct-head span")?.innerText, 10) || 0;
    const trScore = parseInt(sb.querySelector(".scoreboard-hud-tr-head span")?.innerText, 10) || 0;

    const getPlayers = (sel, team) => {
      const arr = [];
      sb.querySelectorAll(sel).forEach((row) => {
        const cols = row.querySelectorAll("td");
        if (cols.length < 5) return;
        const name = cols[1].innerText.trim();
        const kills = parseInt(cols[3].innerText, 10) || 0;
        const deaths = parseInt(cols[4].innerText, 10) || 0;
        if (kills > 0 || deaths > 0) arr.push({ name, kills, deaths, team });
      });
      return arr;
    };

    const ctPlayers = getPlayers(".scoreboard-hud-ct-body tr", "CT");
    const trPlayers = getPlayers(".scoreboard-hud-tr-body tr", "TR");

    fetchLastMatchInfo((last) => {
      const nextHalf = last.half === "First Half" ? "Second Half" : "First Half";
      const nextId = last.half === "First Half" ? last.id : last.id + 1;

      const data = {
        Map: mapName,
        Half: nextHalf,
        "CT Score": ctScore,
        "TR Score": trScore,
        "Players JSON": JSON.stringify([...ctPlayers, ...trPlayers]),
        Date: new Date().toLocaleDateString("en-US"),
        "Match ID": nextId
      };

      log("Sending to Google Apps Script:", data);
      showMsg(`Sending ${nextHalf} for Match ${nextId}...`, "lightblue");

      GM_xmlhttpRequest({
        method: "POST",
        url: API_URL,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ token: CFG.SECRET_TOKEN, data }),
        onload: (res) => {
          if (res.status >= 200 && res.status < 300) {
            showMsg("Sent to Google Sheet successfully!", "green");
          } else {
            showMsg("Error sending data!", "red");
            console.error("Error:", res.status, res.responseText);
          }
        },
        onerror: (e) => {
          showMsg("Network error while sending!", "red");
          console.error("Network error:", e);
        }
      });
    });
  }

  // --- HOTKEYS ---
  log("Loaded. Press P or K to send scoreboard.");
  showMsg("Google Sheet script loaded (P/K)", "lightgreen");

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.key.toLowerCase() === "p" || e.key.toLowerCase() === "k") {
      e.preventDefault();
      captureAndSend();
    }
  });
})();
