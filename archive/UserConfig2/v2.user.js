// ==UserScript==
// @name         CS User Config (Micro)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Automatically executes commands when joining a server, with a UI for management. Highly condensed.
// @author       tiger3homs aka obbe.00 (Improved by Gemini)
// @match        https://game.play-cs.com/*
// @match        https://www.play-cs.com/*
// @icon         https://play-cs.com/img/favicon.png
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const S_KEY = 'cs_user_config_commands';
    let cmds = [];

    const D_CMDS = [
        { cmd: 'bind "MWHEELDOWN" "-duck"', e: true }, { cmd: 'bind "MWHEELUP" "+duck"', e: true },
        { cmd: 'bind "f3" "say NOtt LIVE ⚪❌"', e: true }, { cmd: 'bind "f4" "say KNIVES 🔪🗡️"', e: true },
        { cmd: 'bind "f8" "flash;flash;sgren;"', e: true }, { cmd: 'bind "f5" "deagle;secammo"', e: true },
        { cmd: 'cl_lw 1', e: true }, { cmd: 'cl_lc 1', e: true }, { cmd: 'cl_bob 0', e: true },
    ];

    function lC() {
        try {
            const s = GM_getValue(S_KEY, '[]');
            const p = JSON.parse(s);
            cmds = (p && p.length > 0) ? p : D_CMDS;
        } catch (e) {
            cmds = D_CMDS;
        }
    }

    function sC() { GM_setValue(S_KEY, JSON.stringify(cmds)); }

    function eC() {
        const iF = document.querySelector('.hud-message-input input');
        const f = iF?.closest('form');
        if (!f || !iF) return;
        setTimeout(() => {
            cmds.filter(c => c.e).forEach(c => {
                iF.value = `;${c.cmd}`;
                f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                iF.value = '';
            });
        }, 500);
    }

    const UI = {
        mD: null, cLD: null, aCI: null, aCB: null, sCB: null, rCB: null, cB: null,

        initCSS() {
            document.head.appendChild(Object.assign(document.createElement("style"), {
                innerHTML: `.custom-config-button {        position: fixed;
        top: 50px;
        right: 50px;
        z-index: 9999;
        display: block;
        font-family: Arial, sans-serif;
        color: #00ffae;
        text-decoration: none;
        padding: 10px 15px;
        margin: 10px;
        background: rgba(0,0,0,0.7);
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.2s;}.custom-config-button:hover{background:rgba(0,0,0,0.9)}#cs-user-config-menu input[type="text"]{pointer-events:auto;-webkit-user-modify:read-write-plaintext-only}`
            }));
        },

        createElements() {
            this.cB = Object.assign(document.createElement("a"), { className: "user-button custom-config-button", title: "Config", innerHTML: '<i class="fa fa-cog"></i>' });
            document.body.appendChild(this.cB);

            this.mD = Object.assign(document.createElement('div'), {
                id: 'cs-user-config-menu',
                style: `position:fixed;top:100px;left:10px;width:350px;max-height:90%;overflow-y:auto;background-color:rgba(0,0,0,.9);border:1px solid #444;border-radius:8px;padding:15px;color:#eee;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:14px;z-index:2147483647;pointer-events:auto;user-select:auto;display:none;box-shadow:0 4px 12px rgba(0,0,0,.5);`,
                innerHTML: `<h2 style="margin-top:0;margin-bottom:15px;color:#00bcd4;font-size:20px;text-align:center">CS User Config</h2><div id="command-list" style="margin-bottom:20px"></div><div style="display:flex;margin-bottom:15px"><input type="text" id="add-command-input" placeholder="New command (e.g., bind 'q' 'say hi')" style="flex-grow:1;padding:8px;border:1px solid #555;border-radius:4px;background-color:#333;color:#eee;margin-right:10px;font-size:13px"><button id="add-command-btn" style="background-color:#007bff;color:white;padding:8px 15px;border:none;border-radius:5px;cursor:pointer;font-size:14px;transition:background-color .2s">Add</button></div><div style="text-align:center;display:flex;justify-content:space-around;margin-bottom:10px"><button id="cs-save-btn" style="background-color:#4CAF50;color:white;padding:10px 15px;border:none;border-radius:5px;cursor:pointer;font-size:14px;transition:background-color .2s;flex-grow:1;margin-right:5px">Save</button><button id="cs-rerun-btn" style="background-color:#FFC107;color:#333;padding:10px 15px;border:none;border-radius:5px;cursor:pointer;font-size:14px;transition:background-color .2s;flex-grow:1;margin-left:5px">Rerun</button></div><p style="margin-top:20px;font-size:12px;color:#aaa;text-align:center">Toggle button visibility: Alt + Shift + x</p><p style="margin-top:15px;font-size:8px;color:#444;text-align:center"><a href="https://github.com/tiger3homs/" target="_blank" style="color:#4CAF50;text-decoration:none">obbe.00</a></p>`
            });
            document.body.appendChild(this.mD);

            this.cLD = this.mD.querySelector('#command-list');
            this.aCI = this.mD.querySelector('#add-command-input');
            this.aCB = this.mD.querySelector('#add-command-btn');
            this.sCB = this.mD.querySelector('#cs-save-btn');
            this.rCB = this.mD.querySelector('#cs-rerun-btn');
        },

        rCI(c, i) {
            const item = Object.assign(document.createElement('div'), {
                className: 'command-item',
                style: `display:flex;align-items:center;margin-bottom:8px;background-color:rgba(255,255,255,.08);padding:6px 10px;border-radius:4px;transition:background-color .2s;position:relative;`,
                onmouseover: () => item.style.backgroundColor = 'rgba(255,255,255,.15)',
                onmouseout: () => item.style.backgroundColor = 'rgba(255,255,255,.08)'
            });

            const cb = Object.assign(document.createElement('input'), {
                type: 'checkbox', checked: c.e, style: `margin-right:10px;transform:scale(1.2);cursor:pointer;`,
                onchange: (e) => cmds[i].e = e.target.checked
            });

            const cI = Object.assign(document.createElement('input'), {
                type: 'text', value: c.cmd,
                style: `flex-grow:1;background-color:#333;border:1px solid #555;border-radius:4px;color:#eee;padding:4px 8px;margin-right:10px;font-family:monospace;font-size:13px;`
            });
            ['keydown', 'keypress', 'keyup', 'mousedown', 'click'].forEach(evt => cI.addEventListener(evt, e => { e.stopPropagation(); if (evt === 'click') e.target.focus(); }));

            const dB = Object.assign(document.createElement('button'), {
                textContent: 'X', title: 'Remove Command',
                style: `background-color:#f44336;color:white;border:none;border-radius:4px;width:24px;height:24px;font-size:14px;cursor:pointer;display:flex;justify-content:center;align-items:center;transition:background-color .2s;`,
                onmouseover: (e) => e.target.style.backgroundColor = '#d32f2f',
                onmouseout: (e) => e.target.style.backgroundColor = '#f44336',
                onclick: (e) => { e.stopPropagation(); cmds.splice(i, 1); this.rCL(); }
            });

            item.append(cb, cI, dB);
            this.cLD.appendChild(item);
        },

        rCL() { this.cLD.innerHTML = ''; cmds.forEach((c, i) => this.rCI(c, i)); },

        toggleMenu() {
            if (!this.mD) return;
            const isH = this.mD.style.display === 'none';
            this.mD.style.display = isH ? 'block' : 'none';
            if (isH) {
                if (document.pointerLockElement) document.exitPointerLock();
                setTimeout(() => this.aCI?.focus(), 100);
            } else if (document.activeElement && this.mD.contains(document.activeElement)) document.activeElement.blur();
        },

        addEventListeners() {
            this.cB.addEventListener("click", () => this.toggleMenu());
            this.aCB.addEventListener('click', () => {
                const cT = this.aCI.value.trim();
                if (cT) { cmds.push({ cmd: cT, e: true }); this.aCI.value = ''; this.rCL(); sC(); }
            });
            this.aCI.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.aCB.click(); });
            this.sCB.addEventListener('click', sC);
            this.rCB.addEventListener('click', eC);

            ['keydown', 'keypress', 'keyup', 'mousedown', 'click'].forEach(evt => this.aCI.addEventListener(evt, e => e.stopPropagation()));
            this.mD.addEventListener('keydown', e => { if (document.activeElement && this.mD.contains(document.activeElement)) e.stopPropagation(); }, true);

            document.addEventListener("keydown", (e) => {
                if (e.altKey && e.shiftKey && e.key.toLowerCase() === "x") {
                    e.preventDefault(); e.stopPropagation();
                    const isCBH = this.cB.style.display === "none";
                    this.cB.style.display = isCBH ? "flex" : "none";
                    if (isCBH && this.mD.style.display === "block") {
                        this.mD.style.display = "none";
                        if (document.activeElement && this.mD.contains(document.activeElement)) document.activeElement.blur();
                    }
                }
            }, true);
        },

        init() { this.initCSS(); this.createElements(); this.rCL(); this.addEventListeners(); }
    };

    let iCE = false;
    const gUIO = new MutationObserver(() => {
        const gUIE = document.querySelector('.hud-message-input');
        if (gUIE && !iCE) { eC(); iCE = true; }
        else if (!gUIE && iCE) iCE = false;
    });

    window.addEventListener('load', () => {
        lC(); UI.init();
        gUIO.observe(document.body, { childList: true, subtree: true });
    });
})();
