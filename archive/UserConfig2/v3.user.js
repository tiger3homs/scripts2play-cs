// ==UserScript==
// @name         CS User Config v3
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Refactored script to automatically execute commands with an improved UI.
// @author       tiger3homs aka (obbe.00 on discord)
// @match        https://game.play-cs.com/*
// @match        https://www.play-cs.com/*
// @icon         https://play-cs.com/img/favicon.png
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'cs_user_config_commands_v3';
    let commands = [];

    const DEFAULT_COMMANDS = [
        { cmd: 'bind "MWHEELDOWN" "-duck"', enabled: true },
        { cmd: 'bind "MWHEELUP" "+duck"', enabled: true },
        { cmd: 'bind "f3" "say NOtt LIVE ⚪❌"', enabled: true },
        { cmd: 'bind "f4" "say KNIVES 🔪🗡️"', enabled: true },
        { cmd: 'bind "f8" "flash;flash;sgren;"', enabled: true },
        { cmd: 'bind "f5" "deagle;secammo"', enabled: true },
        { cmd: 'cl_lw 1', enabled: true },
        { cmd: 'cl_lc 1', enabled: true },
        { cmd: 'cl_bob 0', enabled: true },
    ];

    // --- Data Management ---
    function loadCommands() {
        try {
            const storedCommands = GM_getValue(STORAGE_KEY, '[]');
            const parsedCommands = JSON.parse(storedCommands);
            commands = (parsedCommands && parsedCommands.length > 0) ? parsedCommands : DEFAULT_COMMANDS;
        } catch (error) {
            console.error("Error loading commands:", error);
            commands = DEFAULT_COMMANDS;
        }
    }

    function saveCommands() {
        // Before saving, update commands from the UI input fields
        const commandItems = document.querySelectorAll('#cs-v3-command-list .command-item');
        commandItems.forEach((item, index) => {
            const input = item.querySelector('.command-text');
            if (input && commands[index]) {
                commands[index].cmd = input.value;
            }
        });
        GM_setValue(STORAGE_KEY, JSON.stringify(commands));
    }

    // --- Command Execution ---
    function executeCommands() {
        const inputField = document.querySelector('.hud-message-input input');
        const form = inputField?.closest('form');
        if (!form || !inputField) return;

        setTimeout(() => {
            commands.filter(c => c.enabled).forEach(c => {
                inputField.value = `;${c.cmd}`;
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                inputField.value = '';
            });
        }, 500); // Delay to ensure the game is ready
    }


    // --- UI Management ---
    const UIManager = {
        menuDialog: null,
        commandListDiv: null,
        addCommandInput: null,

        init() {
            this.injectCSS();
            this.createUI();
            this.renderCommandList();
            this.addEventListeners();
        },

        injectCSS() {
            const style = document.createElement('style');
            style.innerHTML = `
                .cs-v3-config-button {
                    position: fixed; top: 60px; right: 70px; z-index: 9999;
                    background: rgba(0,0,0,0.7); color: #00ffae;
                    padding: 8px; border-radius: 5px; cursor: pointer;
                    transition: background 0.2s; width: 24px; height: 24px;
                    display: flex; align-items: center; justify-content: center;
                }
                .cs-v3-config-button:hover { background: rgba(0,0,0,0.9); }
                .cs-v3-config-button svg { width: 20px; height: 20px; fill: #00ffae; }

                #cs-v3-config-menu {
                    position: fixed; top: 100px; left: 10px; width: 400px;
                    max-height: 80%; overflow-y: auto; background-color: rgba(20, 20, 20, 0.95);
                    border: 1px solid #444; border-radius: 8px; padding: 20px;
                    color: #eee; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 14px; z-index: 2147483647; display: none;
                    box-shadow: 0 6px 15px rgba(0,0,0,.6); backdrop-filter: blur(5px);
                }
                #cs-v3-config-menu h2 {
                    margin-top: 0; margin-bottom: 20px; color: #00bcd4;
                    font-size: 22px; text-align: center; font-weight: 600;
                }
                .cs-v3-close-btn {
                    position: absolute; top: 15px; right: 20px;
                    color: #aaa; font-size: 28px; font-weight: bold;
                    cursor: pointer; line-height: 1;
                }
                .cs-v3-close-btn:hover { color: #fff; }
                #cs-v3-command-list { margin-bottom: 20px; }
                .command-item {
                    display: flex; align-items: center; margin-bottom: 10px;
                    background-color: rgba(255,255,255,.08); padding: 10px;
                    border-radius: 6px; transition: background-color .2s;
                }
                .command-item:hover { background-color: rgba(255,255,255,.15); }
                .command-item input[type="checkbox"] {
                    margin-right: 12px; transform: scale(1.3); cursor: pointer;
                    accent-color: #00bcd4;
                }
                .command-item .command-text {
                    flex-grow: 1; background-color: #222; border: 1px solid #555;
                    border-radius: 4px; color: #eee; padding: 6px 10px;
                    margin-right: 10px; font-family: monospace; font-size: 13px;
                }
                .command-item .delete-btn {
                    background-color: #f44336; color: white; border: none;
                    border-radius: 4px; width: 28px; height: 28px; font-size: 16px;
                    cursor: pointer; display: flex; justify-content: center;
                    align-items: center; transition: background-color .2s;
                }
                .command-item .delete-btn:hover { background-color: #d32f2f; }

                .cs-v3-input-group { display: flex; margin-bottom: 15px; }
                #cs-v3-add-command-input {
                    flex-grow: 1; padding: 10px; border: 1px solid #555;
                    border-radius: 4px; background-color: #333; color: #eee;
                    margin-right: 10px; font-size: 14px;
                }
                .cs-v3-btn {
                    color: white; padding: 10px 18px; border: none;
                    border-radius: 5px; cursor: pointer; font-size: 14px;
                    transition: background-color .2s;
                }
                #cs-v3-add-btn { background-color: #007bff; }
                #cs-v3-add-btn:hover { background-color: #0056b3; }

                .cs-v3-button-group { display: flex; justify-content: space-around; }
                #cs-v3-save-btn { background-color: #4CAF50; flex-grow: 1; margin-right: 5px; }
                #cs-v3-save-btn:hover { background-color: #45a049; }
                #cs-v3-rerun-btn { background-color: #FFC107; color: #333; flex-grow: 1; margin-left: 5px; }
                #cs-v3-rerun-btn:hover { background-color: #e0a800; }

                .cs-v3-footer-text {
                    margin-top: 20px; font-size: 12px; color: #aaa; text-align: center;
                }
                 .cs-v3-footer-link {
                    margin-top: 15px; font-size: 10px; color: #555; text-align: center;
                }
                .cs-v3-footer-link a { color: #4CAF50; text-decoration: none; }
            `;
            document.head.appendChild(style);
        },

        createUI() {
            const configButton = document.createElement("a");
            configButton.className = "user-button cs-v3-config-button";
            configButton.title = "Config";
            configButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.44,0.17-0.48,0.41L9.2,5.77C8.61,6.01,8.08,6.33,7.58,6.71L5.19,5.75C4.97,5.68,4.72,5.75,4.6,5.95L2.68,9.27 c-0.11,0.2-0.06,0.47,0.12,0.61L4.83,11.4c-0.04,0.3-0.06,0.61-0.06,0.94s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.04,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.48-0.41l0.36-2.54c0.59-0.24,1.12-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0.01,0.59-0.22l1.92-3.32c0.11-0.2,0.06-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`;
            document.body.appendChild(configButton);
            this.configButton = configButton;

            this.menuDialog = document.createElement('div');
            this.menuDialog.id = 'cs-v3-config-menu';
            this.menuDialog.innerHTML = `
                <span class="cs-v3-close-btn">&times;</span>
                <h2>CS User Config v3</h2>
                <div id="cs-v3-command-list"></div>
                <div class="cs-v3-input-group">
                    <input type="text" id="cs-v3-add-command-input" placeholder="e.g., bind 'q' 'say hi'">
                    <button id="cs-v3-add-btn" class="cs-v3-btn">Add</button>
                </div>
                <div class="cs-v3-button-group">
                    <button id="cs-v3-save-btn" class="cs-v3-btn">Save</button>
                    <button id="cs-v3-rerun-btn" class="cs-v3-btn">Rerun</button>
                </div>
                <p class="cs-v3-footer-text">Toggle button visibility: Alt + Shift + x</p>
                <p class="cs-v3-footer-link">
                    <a href="https://github.com/tiger3homs/" target="_blank">obbe.00</a>
                </p>
            `;
            document.body.appendChild(this.menuDialog);

            this.commandListDiv = this.menuDialog.querySelector('#cs-v3-command-list');
            this.addCommandInput = this.menuDialog.querySelector('#cs-v3-add-command-input');
        },

        renderCommandList() {
            this.commandListDiv.innerHTML = '';
            commands.forEach((command, index) => {
                const item = document.createElement('div');
                item.className = 'command-item';
                item.innerHTML = `
                    <input type="checkbox" ${command.enabled ? 'checked' : ''}>
                    <input type="text" class="command-text" value="${command.cmd.replace(/"/g, '&quot;')}">
                    <button class="delete-btn" title="Remove Command">X</button>
                `;
                this.commandListDiv.appendChild(item);

                // Add event listeners for this item
                item.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                    commands[index].enabled = e.target.checked;
                });
                item.querySelector('.delete-btn').addEventListener('click', () => {
                    commands.splice(index, 1);
                    this.renderCommandList();
                });
            });
        },

        toggleMenu() {
            const isHidden = this.menuDialog.style.display === 'none';
            this.menuDialog.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                if (document.pointerLockElement) document.exitPointerLock();
                setTimeout(() => this.addCommandInput?.focus(), 100);
            } else if (document.activeElement && this.menuDialog.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        },

        addEventListeners() {
            this.configButton.addEventListener("click", () => this.toggleMenu());
            this.menuDialog.querySelector('.cs-v3-close-btn').addEventListener('click', () => this.toggleMenu());

            this.menuDialog.querySelector('#cs-v3-add-btn').addEventListener('click', () => {
                const newCommandText = this.addCommandInput.value.trim();
                if (newCommandText) {
                    commands.push({ cmd: newCommandText, enabled: true });
                    this.addCommandInput.value = '';
                    this.renderCommandList();
                    saveCommands();
                }
            });

            this.addCommandInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.menuDialog.querySelector('#cs-v3-add-btn').click();
                }
            });

            this.menuDialog.querySelector('#cs-v3-save-btn').addEventListener('click', saveCommands);
            this.menuDialog.querySelector('#cs-v3-rerun-btn').addEventListener('click', executeCommands);

            // Prevent game controls from being triggered while typing in the menu
            const stopPropagation = (e) => e.stopPropagation();
            ['keydown', 'keypress', 'keyup', 'mousedown', 'click'].forEach(evt => {
                this.addCommandInput.addEventListener(evt, stopPropagation);
                this.commandListDiv.addEventListener(evt, (e) => {
                    if (e.target.classList.contains('command-text')) {
                        stopPropagation(e);
                    }
                });
            });

            document.addEventListener("keydown", (e) => {
                if (e.altKey && e.shiftKey && e.key.toLowerCase() === "x") {
                    e.preventDefault();
                    e.stopPropagation();
                    const isHidden = this.configButton.style.display === "none";
                    this.configButton.style.display = isHidden ? "flex" : "none";
                }
            }, true);
        }
    };

    // --- Initialization ---
    function main() {
        loadCommands();
        UIManager.init();

        let commandsExecuted = false;
        const gameUIObserver = new MutationObserver(() => {
            const gameUIElement = document.querySelector('.hud-message-input');
            if (gameUIElement && !commandsExecuted) {
                executeCommands();
                commandsExecuted = true;
            } else if (!gameUIElement && commandsExecuted) {
                commandsExecuted = false; // Reset when leaving a server
            }
        });

        gameUIObserver.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('load', main);

})();
