// ==UserScript==
// @name         CS User Config (Advanced)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically executes a set of commands once when you join a server, with a UI for adding, editing, and enabling/disabling commands.
// @author       tiger3homs aka obbe.00 on discord (Improved by Gemini)
// @match        https://game.play-cs.com/*
// @match        https://www.play-cs.com/*
// @icon         https://play-cs.com/img/favicon.png
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'cs_user_config_commands';

    let commands = [
        { command: 'bind "MWHEELDOWN" "-duck"', enabled: true },
        { command: 'bind "MWHEELUP" "+duck"', enabled: true },
        { command: 'bind "f3" "say NOtt LIVE ⚪❌"', enabled: true },
        { command: 'bind "f4" "say KNIVES 🔪🗡️"', enabled: true },
        { command: 'bind "f8" "flash;flash;sgren;"', enabled: true },
        { command: 'bind "f5" "deagle;secammo"', enabled: true },
        { command: 'cl_lw 1', enabled: true },
        { command: 'cl_lc 1', enabled: true },
        { command: 'cl_bob 0', enabled: true },
    ];

    // --- Menu UI Elements ---
    let menuDiv;
    let commandListDiv;
    let addCommandInput;
    let addCommandBtn;
    let saveConfigBtn;
    let rerunCommandsBtn;

    /**
     * Loads commands from Tampermonkey's storage.
     */
    function loadCommands() {
        try {
            const storedCommands = GM_getValue(STORAGE_KEY, '[]');
            const parsedCommands = JSON.parse(storedCommands);
            if (parsedCommands.length > 0) {
                commands = parsedCommands;
                console.log('CS User Config: Loaded commands from storage.');
            } else {
                console.log('CS User Config: No stored commands found, using defaults.');
            }
        } catch (e) {
            console.error('CS User Config: Error loading commands:', e);
            console.log('CS User Config: Resetting to default commands due to load error.');
            commands = [
                { command: 'bind "MWHEELDOWN" "-duck"', enabled: true },
                { command: 'bind "MWHEELUP" "+duck"', enabled: true },
                { command: 'bind "f3" "say NOtt LIVE ⚪❌"', enabled: true },
                { command: 'bind "f4" "say KNIVES 🔪🗡️"', enabled: true },
                { command: 'bind "f8" "flash;flash;sgren;"', enabled: true },
                { command: 'bind "f5" "deagle;secammo"', enabled: true },
                { command: 'cl_lw 1', enabled: true },
                { command: 'cl_lc 1', enabled: true },
                { command: 'cl_bob 0', enabled: true },
            ];
        }
    }

    /**
     * Saves current commands to Tampermonkey's storage.
     */
    function saveCommands() {
        GM_setValue(STORAGE_KEY, JSON.stringify(commands));
        console.log('CS User Config: Saved commands to storage.');
    }

    /**
     * Renders a single command item in the list.
     */
    function renderCommandItem(cmd, index) {
        const commandItemDiv = document.createElement('div');
        commandItemDiv.className = 'command-item';
        commandItemDiv.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            background-color: rgba(255, 255, 255, 0.08);
            padding: 6px 10px;
            border-radius: 4px;
            transition: background-color 0.2s;
            position: relative;
        `;
        commandItemDiv.onmouseover = () => commandItemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        commandItemDiv.onmouseout = () => commandItemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = cmd.enabled;
        checkbox.style.cssText = `
            margin-right: 10px;
            transform: scale(1.2);
            cursor: pointer;
        `;
        checkbox.addEventListener('change', (e) => {
            commands[index].enabled = e.target.checked;
        });

        const commandInput = document.createElement('input');
        commandInput.type = 'text';
        commandInput.value = cmd.command;
        commandInput.style.cssText = `
            flex-grow: 1;
            background-color: #333;
            border: 1px solid #555;
            border-radius: 4px;
            color: #eee;
            padding: 4px 8px;
            margin-right: 10px;
            font-family: monospace;
            font-size: 13px;
            pointer-events: auto;
            -webkit-user-modify: read-write-plaintext-only;
        `;
        // Add event listeners to stop propagation for keyboard events
        commandInput.addEventListener('keydown', (e) => e.stopPropagation());
        commandInput.addEventListener('keypress', (e) => e.stopPropagation());
        commandInput.addEventListener('keyup', (e) => e.stopPropagation());
        // Also ensure focus on click
        commandInput.addEventListener('mousedown', (e) => e.stopPropagation()); // prevent other listeners from taking over
        commandInput.addEventListener('click', (e) => {
            e.stopPropagation();
            e.target.focus();
        });


        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.title = 'Remove Command';
        deleteButton.style.cssText = `
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            width: 24px;
            height: 24px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: background-color 0.2s;
        `;
        deleteButton.onmouseover = () => deleteButton.style.backgroundColor = '#d32f2f';
        deleteButton.onmouseout = () => deleteButton.style.backgroundColor = '#f44336';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop propagation for button clicks too
            commands.splice(index, 1);
            renderCommandList();
        });

        commandItemDiv.appendChild(checkbox);
        commandItemDiv.appendChild(commandInput);
        commandItemDiv.appendChild(deleteButton);
        commandListDiv.appendChild(commandItemDiv);
    }

    /**
     * Renders the entire list of commands.
     */
    function renderCommandList() {
        commandListDiv.innerHTML = '';
        commands.forEach((cmd, index) => renderCommandItem(cmd, index));
    }

    /**
     * Creates and appends the HTML menu to the body.
     */
    function createMenu() {
        menuDiv = document.createElement('div');
        menuDiv.id = 'cs-user-config-menu';
        menuDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            width: 350px;
            max-height: 90%;
            overflow-y: auto;
            background-color: rgba(0, 0, 0, 0.9);
            border: 1px solid #444;
            border-radius: 8px;
            padding: 15px;
            color: #eee;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            z-index: 2147483647;
            pointer-events: auto;
            user-select: auto;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        menuDiv.innerHTML = `
            <h2 style="margin-top: 0; margin-bottom: 15px; color: #00bcd4; font-size: 20px; text-align: center;">CS User Config</h2>
            <div id="command-list" style="margin-bottom: 20px;"></div>
            <div style="display: flex; margin-bottom: 15px;">
                <input type="text" id="add-command-input" placeholder="New command (e.g., bind 'q' 'say hi')" style="
                    flex-grow: 1;
                    padding: 8px;
                    border: 1px solid #555;
                    border-radius: 4px;
                    background-color: #333;
                    color: #eee;
                    margin-right: 10px;
                    font-size: 13px;
                    pointer-events: auto;
                    -webkit-user-modify: read-write-plaintext-only;
                ">
                <button id="add-command-btn" style="
                    background-color: #007bff;
                    color: white;
                    padding: 8px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                ">Add</button>
            </div>
            <div style="text-align: center; display: flex; justify-content: space-around; margin-bottom: 10px;">
                <button id="cs-save-btn" style="
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                    flex-grow: 1;
                    margin-right: 5px;
                ">Save Configuration</button>
                <button id="cs-rerun-btn" style="
                    background-color: #FFC107;
                    color: #333;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                    flex-grow: 1;
                    margin-left: 5px;
                ">Rerun Commands</button>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #aaa; text-align: center;">Toggle menu: Alt + Shift + X</p>
            <p style="margin-top: 15px; font-size: 8px; color: #444; text-align: center;"><a href="https://github.com/tiger3homs/"
                       target="_blank"
                       style="color:#4CAF50; text-decoration:none;">
                        obbe.00 on discord
                    </a></p>
        `;

        document.body.appendChild(menuDiv);

        commandListDiv = menuDiv.querySelector('#command-list');
        addCommandInput = menuDiv.querySelector('#add-command-input');
        addCommandBtn = menuDiv.querySelector('#add-command-btn');
        saveConfigBtn = menuDiv.querySelector('#cs-save-btn');
        rerunCommandsBtn = menuDiv.querySelector('#cs-rerun-btn');

        // Add event listeners to stop propagation for keyboard events on the add input
        addCommandInput.addEventListener('keydown', (e) => e.stopPropagation());
        addCommandInput.addEventListener('keypress', (e) => e.stopPropagation());
        addCommandInput.addEventListener('keyup', (e) => e.stopPropagation());
        addCommandInput.addEventListener('mousedown', (e) => e.stopPropagation()); // Also for mouse clicks
        addCommandInput.addEventListener('click', (e) => {
            e.stopPropagation();
            e.target.focus();
        });

        // Add event listeners
        addCommandBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop propagation for button clicks
            const commandText = addCommandInput.value.trim();
            if (commandText) {
                commands.push({ command: commandText, enabled: true });
                addCommandInput.value = '';
                renderCommandList();
                saveCommands();
            }
        });

        addCommandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addCommandBtn.click();
            }
        });

        saveConfigBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop propagation for button clicks
            saveCommands();
        });
        rerunCommandsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop propagation for button clicks
            executeConfig();
        });

        // Capture all keyboard events on the menu itself when open
        menuDiv.addEventListener('keydown', (e) => {
            console.log('CS User Config: Menu keydown event captured!', e.key); // Debugging
            if (document.activeElement && menuDiv.contains(document.activeElement)) {
                e.stopPropagation(); // Stop propagation for inputs within the menu
            }
        }, true); // Use capturing phase to get events before others
        menuDiv.addEventListener('keypress', (e) => {
            console.log('CS User Config: Menu keypress event captured!', e.key); // Debugging
            if (document.activeElement && menuDiv.contains(document.activeElement)) {
                e.stopPropagation();
            }
        }, true);
        menuDiv.addEventListener('keyup', (e) => {
            if (document.activeElement && menuDiv.contains(document.activeElement)) {
                e.stopPropagation();
            }
        }, true);

        renderCommandList();
    }

    /**
     * Toggles the visibility of the menu.
     * Manages pointer lock state and input focus.
     */
    function toggleMenu() {
        if (menuDiv) {
            if (menuDiv.style.display === 'none') {
                menuDiv.style.display = 'block';
                if (document.pointerLockElement) {
                    document.exitPointerLock();
                    console.log('CS User Config: Exited pointer lock.');
                }
                setTimeout(() => {
                    const firstInput = menuDiv.querySelector('input[type="text"]');
                    if (firstInput) {
                        firstInput.focus();
                        console.log('CS User Config: Attempted to focus on first input.');
                    }
                }, 100);
            } else {
                menuDiv.style.display = 'none';
                if (document.activeElement && menuDiv.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
            }
        }
    }

    /**
     * Handles keyboard shortcuts for the menu.
     */
    function handleKeyPress(e) {
        if (e.altKey && e.shiftKey && e.key === 'X' &&
            !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            toggleMenu();
            e.preventDefault();
            e.stopPropagation(); // Important for the toggle shortcut itself
        }
    }

    // --- Core Execution Logic ---
    function executeConfig() {
        const form = document.querySelector('.hud-message-input form');
        const inputField = document.querySelector('.hud-message-input input');

        if (!form || !inputField) {
            console.warn('CS User Config: Could not find chat elements. Are you in a server?');
            return;
        }

        console.log('CS User Config: In-game chat detected. Executing enabled commands...');

        setTimeout(() => {
            let executedCount = 0;
            commands.forEach(({ command, enabled }) => {
                if (enabled) {
                    inputField.value = `;${command}`;
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    inputField.value = '';
                    executedCount++;
                }
            });
            if (executedCount > 0) {
                console.log(`CS User Config: ${executedCount} enabled commands have been executed.`);
            } else {
                console.log('CS User Config: No enabled commands to execute.');
            }
        }, 500);
    }

    // --- Observer for game UI ---
    let gameUIObserver;
    let initialConfigExecuted = false;

    function setupGameUIObserver() {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const callback = function(mutationsList, observer) {
            const gameUIElement = document.querySelector('.hud-message-input');
            if (gameUIElement && !initialConfigExecuted) {
                executeConfig();
                initialConfigExecuted = true;
            } else if (!gameUIElement && initialConfigExecuted) {
                initialConfigExecuted = false;
                console.log('CS User Config: Game UI not detected, resetting command execution flag.');
            }
        };

        gameUIObserver = new MutationObserver(callback);
        gameUIObserver.observe(targetNode, config);
        console.log('CS User Config: MutationObserver started, waiting for game UI.');
    }

    // --- Main Execution ---
    window.addEventListener('load', () => {
        loadCommands();
        createMenu();
        // Attaching handleKeyPress to the window with 'true' for capturing phase
        window.addEventListener('keydown', handleKeyPress, true);
        setupGameUIObserver();
    });

})();
