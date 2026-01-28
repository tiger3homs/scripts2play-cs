// ==UserScript==
// @name         Play-CS HUD Animated Logo - Slide & Glow
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Logo slides right-to-left with a pulsing white glow effect; Hides clutter while keeping PIN screen visible.
// @author       You
// @match        https://game.play-cs.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 1. Apply CSS for HUD, Animations, and selective Hiding
    GM_addStyle(`
        /* Repositioning the Live Blocks */
        .hud-live-block {
            position: absolute !important;
            width: 150px !important;
            z-index: 13 !important;
        }

        .hud-ct-live-block {
            right: 50% !important;
            margin-right: 500px !important;
        }

        .hud-t-live-block {
            left: 50% !important;
            margin-left: 500px !important;
        }

        /* Custom Logo Style */
        #custom-hud-logo {
            position: fixed;
            top: 10px;
            left: 10px;
            width: 100px;
            height: 100px;
            z-index: 9999;
            pointer-events: none;
            filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
            transform: translateX(0);
        }

        /* The combined Slide and Beat animation */
        .logo-animate {
            animation: slide-glow-beat 2s ease-in-out;
        }

        @keyframes slide-glow-beat {
            0% {
                transform: translateX(0) scale(1);
                filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
            }
            25% {
                transform: translateX(30px) scale(1.1);
                filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
            }
            50% {
                transform: translateX(-10px) scale(1.2);
                filter: drop-shadow(0 0 20px rgba(255, 255, 255, 1));
            }
            75% {
                transform: translateX(15px) scale(1.1);
                filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
            }
            100% {
                transform: translateX(0) scale(1);
                filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
            }
        }

        /* Hiding Clutter logic */
        /* Targets elements to hide, but EXCLUDES the PIN entry screen (#server_full) */
        .hud-credits,
        .hud-in-specmode,
        #exit-to-lobby,
        #complain_button,
        #votekick_button,
        #amxmodmenu,
        .reload-button,
        .invite-button:not(#server_full) {
            display: none !important;
        }


    `);

    // 2. Create and Inject the Logo
    const logo = document.createElement('img');
    logo.id = 'custom-hud-logo';
    logo.src = 'https://raw.githubusercontent.com/tiger3homs/scripts2play-cs/refs/heads/main/all_started_from_here/online/logo-512-512.webp';
    document.body.appendChild(logo);

    // 3. Logic to trigger animation every 5-10 seconds
    function triggerAnimation() {
        // Add the animation class
        logo.classList.add('logo-animate');

        // Remove it after the animation cycle (2s)
        setTimeout(() => {
            logo.classList.remove('logo-animate');
        }, 2000);

        // Pick a random delay for the next sequence (5-10 seconds)
        const nextDelay = Math.floor(Math.random() * (10000 - 5000 + 1) + 5000);
        setTimeout(triggerAnimation, nextDelay);
    }

    // Start the loop
    triggerAnimation();

})();
