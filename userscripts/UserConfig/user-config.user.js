// ==UserScript==
// @name         CS User Config (Reliable Join Execution)
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Automatically executes a set of commands once when you join a server, now with improved timing.
// @author       tiger3homs aka obbe.00 on discord (Improved by Gemini)
// @match        https://game.play-cs.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    const commands = [
        { command: 'bind "MWHEELDOWN" "-duck"',       enabled: true },
        { command: 'bind "MWHEELUP" "+duck"',         enabled: true },
        { command: 'bind "f3" "say NOtt LIVE ⚪❌"', enabled: true },
        { command: 'bind "f4" "say KNIVES 🔪🗡️"',   enabled: true },
        { command: 'bind "f8" "flash;flash;sgren;"', enabled: true },
        { command: 'bind "f5" "deagle;secammo"',     enabled: true },
        { command: "cl_lw 1",                       enabled: true },
        { command: "cl_lc 1",                       enabled: true },
        { command: "cl_bob 0",                      enabled: true },
        { command: "stopsound",                     enabled: true },
        { command: "ducks",                         enabled: true },
        { command: "minmodels",                     enabled: true },
    ];

    /**
     * Executes the commands once the in-game UI is confirmed to be present.
     */
    function executeConfig() {
        const form = document.querySelector('.hud-message-input form');
        const inputField = document.querySelector('.hud-message-input input');

        // This check is a final safeguard, though it should always pass by this point.
        if (!form || !inputField) {
            console.error('CS User Config: Could not find chat elements after UI was detected.');
            return;
        }

        console.log('CS User Config: In-game UI detected. Executing commands...');

        // A brief delay to ensure the game is fully ready to accept input.
        setTimeout(() => {
            commands.forEach(({ command, enabled }) => {
                if (enabled) {
                    inputField.value = `;${command}`;
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
            });
            console.log('CS User Config: All commands have been executed for this session.');
        }, 500);
    }

    /**
     * Starts an interval that repeatedly checks for the in-game UI.
     * This is the function that will run once the page is fully loaded.
     */
    function startCheckingForGame() {
        console.log('CS User Config: Page loaded. Now waiting for user to join a server...');

        const initializationInterval = setInterval(() => {
            // We only need to check for one of the elements.
            const gameUIElement = document.querySelector('.hud-message-input');

            if (gameUIElement) {
                // UI is found! Stop checking and run the commands.
                clearInterval(initializationInterval);
                executeConfig();
            }
        }, 1000); // Check every second.
    }

    // --- Main Execution ---
    // This is the most important change.
    // We wait for the entire window, including all scripts and assets, to fully load.
    // Only THEN do we start checking for the in-game UI.
    window.addEventListener('load', startCheckingForGame);

})();
