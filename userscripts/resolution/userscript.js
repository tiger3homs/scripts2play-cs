// ==UserScript==
// @name         CS 1.6 Resolution Menu (Exact Scale + Stretch Toggle Fixed + Centered) - Improved v2
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Add a resolution menu for CS 1.6 web client with improved exact scaling, centering, working stretch toggle, and custom non-uniform scales.
// @author       You
// @match        https://game.play-cs.com/*
// @icon         https://play-cs.com/img/favicon.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Default values
    let stretchMode = JSON.parse(localStorage.getItem('csResolutionStretchMode')) || false;
    let lastResolution = JSON.parse(localStorage.getItem('csResolutionLastApplied')) || null;

    // The element that contains the actual game content.
    // This is often an iframe or a canvas. If not found, we'll fall back to document.body.
    // You might need to inspect the game page to find the exact selector for the game's primary container.
    const gameContainerSelector = 'body'; // Assuming body for now, but inspect if performance/layout issues occur
    let gameElement = document.querySelector(gameContainerSelector);

    // --- Create Resolution Button ---
    const resolutionBtn = document.createElement("a");
    resolutionBtn.className = "user-button resolution-button";
    resolutionBtn.title = "Resolution";
    resolutionBtn.innerHTML = '<i class="fa fa-expand"></i>';
    resolutionBtn.style.display = localStorage.getItem('csResolutionBtnVisible') === 'true' ? 'block' : 'none'; // Persist visibility
    document.body.appendChild(resolutionBtn);

    // --- Create Resolution Menu ---
    const resolutionMenu = document.createElement("div");
    resolutionMenu.className = "resolution-menu";
    resolutionMenu.style.display = "none"; // Menu always starts hidden
    document.body.appendChild(resolutionMenu);

    // --- Apply resolution ---
    function applyResolution(baseWidth, baseHeight, scaleFactorX = 1, scaleFactorY = 1) {
        if (!gameElement) {
            gameElement = document.querySelector(gameContainerSelector);
            if (!gameElement) {
                console.warn('Game container element not found:', gameContainerSelector);
                return; // Cannot apply resolution if element not found
            }
        }

        // Save current settings
        localStorage.setItem('csResolutionStretchMode', JSON.stringify(stretchMode));
        localStorage.setItem('csResolutionLastApplied', JSON.stringify({ baseWidth, baseHeight, scaleFactorX, scaleFactorY }));

        // Clear previous custom styles to ensure a clean slate
        gameElement.style.cssText = '';
        document.body.style.cssText = ''; // Also clear body in case it had conflicting styles

        if (stretchMode) {
            // Stretch to fill the entire window, ignoring aspect ratio if needed
            gameElement.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                transform: none !important; /* No scaling transform, fill directly */
                margin: 0 !important;
                background-color: black !important;
                overflow: hidden !important;
                display: block !important;
            `;
            // Ensure body itself has no margins/padding if gameElement is body
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.overflow = 'hidden';
            document.body.style.backgroundColor = 'black';
        } else {
            // Centered, specified scaling (can be uniform or non-uniform)
            gameElement.style.cssText = `
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                width: ${baseWidth}px !important;
                height: ${baseHeight}px !important;
                transform: translate(-50%, -50%) scale(${scaleFactorX}, ${scaleFactorY}) !important;
                transform-origin: center center !important; /* Always center origin for robust centering */
                margin: 0 !important; /* Remove margin as transform handles positioning */
                background-color: black !important;
                overflow: hidden !important;
                display: block !important;
            `;
            // Ensure body itself has no margins/padding if gameElement is body
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.overflow = 'hidden';
            document.body.style.backgroundColor = 'black';
        }

        lastResolution = { baseWidth, baseHeight, scaleFactorX, scaleFactorY };
    }


    // --- CS 1.6 Resolutions (base dimensions + explicit scaleX, scaleY) ---
    // The scaleFactorX/Y now represents the *desired multiplier* for the base resolution.
    // For uniform scaling, scaleX === scaleY. For non-uniform (stretched), they differ.
    // I've adjusted the labels for clarity to show (Scale X,Y)
    const resolutions = [
        // Original uniform scales
        { label: "640x480 (Scale x2.0, x2.0)", w: 640, h: 480, sx: 2.0, sy: 2.0 },
        { label: "800x600 (Scale x1.8, x1.8)", w: 800, h: 600, sx: 1.8, sy: 1.8 },
        { label: "1024x768 (Scale x1.5, x1.5)", w: 1024, h: 768, sx: 1.5, sy: 1.5 },
        { label: "1280x960 (Scale x1.2, x1.2)", w: 1280, h: 960, sx: 1.2, sy: 1.2 },
        { label: "1440x1080 (Scale x1.0, x1.0)", w: 1440, h: 1080, sx: 1.0, sy: 1.0 }, // 'native' 4:3
        { label: "1920x1080 (Scale x1.0, x1.0)", w: 1920, h: 1080, sx: 1.0, sy: 1.0 }, // 'native' 16:9

        // Common uniform scales
        { label: "1280x720 (HD Ready x1.5, x1.5)", w: 1280, h: 720, sx: 1.5, sy: 1.5 },
        { label: "1366x768 (Laptop Std x1.4, x1.4)", w: 1366, h: 768, sx: 1.4, sy: 1.4 },
        { label: "2560x1440 (QHD x0.75, x0.75)", w: 2560, h: 1440, sx: 0.75, sy: 0.75 },
        { label: "3840x2160 (4K x0.5, x0.5)", w: 3840, h: 2160, sx: 0.5, sy: 0.5 },
        { label: "1600x900 (Wider x1.2, x1.2)", w: 1600, h: 900, sx: 1.2, sy: 1.2 },
        { label: "1680x1050 (16:10 x1.14, x1.14)", w: 1680, h: 1050, sx: 1.14, sy: 1.14 },

        // --- CUSTOM RESOLUTIONS FROM USER INPUT (Non-uniform scales) ---
        // Note: For these, the `width` and `height` properties on the body
        //       represent the *logical* resolution the game is meant to display at,
        //       before the transform. The `scaleX` and `scaleY` then stretch/shrink it.
        //       The `transform-origin` from your examples (e.g., 1055px 0px) is *not*
        //       directly applied here because `translate(-50%, -50%)` combined with
        //       `transform-origin: center center` is the most reliable way to center
        //       the scaled content on the screen regardless of window size.
        //       If you explicitly need top-left scaling (0px 0px), please confirm.

        { label: "1920x1080 (Scale x0.9, x1.0)", w: 1920, h: 1080, sx: 0.9, sy: 1.0 },
        { label: "1920x1080 (Scale x0.75, x1.0)", w: 1920, h: 1080, sx: 0.75, sy: 1.0 },
        { label: "960x1080 (Scale x2.0, x1.0)", w: 960, h: 1080, sx: 2.0, sy: 1.0 },
        { label: "1920x1080 (Scale x0.8, x1.0)", w: 1920, h: 1080, sx: 0.8, sy: 1.0 },
        { label: "1444x1080 (Scale x1.33, x1.0)", w: 1444, h: 1080, sx: 1.33, sy: 1.0 },
    ];

    // --- Populate resolution menu ---
    resolutions.forEach(({ label, w, h, sx, sy }) => {
        const option = document.createElement("div");
        option.className = "resolution-option";
        option.textContent = label;
        option.addEventListener("click", () => {
            applyResolution(w, h, sx, sy);
            resolutionMenu.style.display = "none";
        });
        resolutionMenu.appendChild(option);
    });

    // --- Toggle Stretch Option ---
    const stretchOption = document.createElement("div");
    stretchOption.className = "resolution-option";
    stretchOption.textContent = `Toggle Stretch (${stretchMode ? "ON" : "OFF"})`;
    stretchOption.addEventListener("click", () => {
        stretchMode = !stretchMode;
        stretchOption.textContent = `Toggle Stretch (${stretchMode ? "ON" : "OFF"})`;

        // Re-apply last resolution immediately or a default if none selected
        if (lastResolution) {
            applyResolution(lastResolution.baseWidth, lastResolution.baseHeight, lastResolution.scaleFactorX, lastResolution.scaleFactorY);
        } else {
            // Apply a default resolution if none was previously set
            applyResolution(1920, 1080, 1.0, 1.0); // Default to Full HD 16:9, 1:1 scale
        }
    });
    resolutionMenu.appendChild(stretchOption);

    // --- Reset option ---
    const resetOption = document.createElement("div");
    resetOption.className = "resolution-option";
    resetOption.textContent = "Reset (Default)";
    resetOption.addEventListener("click", () => {
        // Clear all custom styles applied by the script
        if (gameElement) {
            gameElement.style.cssText = '';
        }
        document.body.style.cssText = ''; // Ensure body is also reset
        resolutionMenu.style.display = "none";
        lastResolution = null;
        stretchMode = false; // Reset stretch mode on default
        stretchOption.textContent = `Toggle Stretch (OFF)`;
        localStorage.removeItem('csResolutionLastApplied');
        localStorage.removeItem('csResolutionStretchMode');
        localStorage.removeItem('csResolutionBtnVisible');
    });
    resolutionMenu.appendChild(resetOption);

    // --- CSS Styles ---
    const style = document.createElement("style");
    style.textContent = `
    .resolution-button {
        position: fixed;
        top: 50px;
        right: 100px;
        z-index: 99999; /* Increased z-index */
        display: block;
        font-family: Arial, sans-serif;
        color: #00ffae;
        text-decoration: none;
        padding: 10px 15px;
        margin: 10px;
        background: rgba(0,0,0,0.7);
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.2s;
    }
    .resolution-button:hover {
        background: rgba(0,0,0,0.9);
    }
    .resolution-menu {
        position: fixed;
        top: 50px; /* Adjusted top for alignment with button */
        right: 10px; /* Adjusted right for better placement */
        background: rgba(0,0,0,0.85);
        border-radius: 5px;
        padding: 10px;
        z-index: 100000; /* Increased z-index */
        min-width: 200px;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .resolution-option {
        color: #fff;
        padding: 8px 12px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        border-radius: 3px;
        transition: background 0.2s;
    }
    .resolution-option:hover {
        background: rgba(255,255,255,0.2);
    }
    `;
    document.head.appendChild(style);

    // --- Toggle Button Visibility (Alt+Shift+c) ---
    document.addEventListener("keydown", (e) => {
        if (e.altKey && e.shiftKey && e.key.toLowerCase() === "c") {
            const isVisible = resolutionBtn.style.display === "none";
            resolutionBtn.style.display = isVisible ? "block" : "none";
            localStorage.setItem('csResolutionBtnVisible', isVisible); // Persist visibility
            // Close menu if button hidden
            if (!isVisible) {
                resolutionMenu.style.display = "none";
            }
        }
    });

    // --- Toggle Menu ---
    resolutionBtn.addEventListener("click", () => {
        resolutionMenu.style.display = resolutionMenu.style.display === "none" ? "flex" : "none";
    });

    // --- Initial application on page load ---
    window.addEventListener('load', () => {
        // If the game container is not body, we need to find it after content has loaded
        if (gameContainerSelector !== 'body' && !gameElement) {
             gameElement = document.querySelector(gameContainerSelector);
        }

        // Apply last saved resolution, or a default if none exists
        if (lastResolution) {
            applyResolution(lastResolution.baseWidth, lastResolution.baseHeight, lastResolution.scaleFactorX, lastResolution.scaleFactorY);
        } else {
            // Default to 1920x1080 at 1:1 scale on first load if no setting found
            applyResolution(1920, 1080, 1.0, 1.0);
        }
    });

    // Reapply resolution on window resize if stretchMode is active, or if a fixed scaling is used (to re-center)
    window.addEventListener('resize', () => {
        if (lastResolution) { // Always reapply if there's a last resolution, to handle centering or stretching
            applyResolution(lastResolution.baseWidth, lastResolution.baseHeight, lastResolution.scaleFactorX, lastResolution.scaleFactorY);
        }
    });

})();
