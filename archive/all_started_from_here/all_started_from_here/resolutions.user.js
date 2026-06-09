// ==UserScript==
// @name         CS 1.6 Resolution Menu (Exact Scale + Stretch Toggle Fixed + Centered)
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  Add a resolution menu for CS 1.6 web client (exact scaling, centered, working stretch toggle)
// @author       You
// @match        https://game.play-cs.com/*
// @icon         https://play-cs.com/img/favicon.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let stretchMode = false; // default OFF
    let lastResolution = null; // store last applied resolution

    // --- Create Resolution Button ---
    const resolutionBtn = document.createElement("a");
    resolutionBtn.className = "user-button resolution-button";
    resolutionBtn.title = "Resolution";
    resolutionBtn.innerHTML = '<i class="fa fa-expand"></i>';
    resolutionBtn.style.display = "none";
    document.body.appendChild(resolutionBtn);

    // --- Create Resolution Menu ---
    const resolutionMenu = document.createElement("div");
    resolutionMenu.className = "resolution-menu";
    resolutionMenu.style.display = "none";
    document.body.appendChild(resolutionMenu);

    // --- Apply resolution ---
    // Modified: Centering logic improved for scaled elements
    function applyResolution(width, height, scaleX, scaleY) {
        let sx = scaleX, sy = scaleY;
        let transformOrigin = 'center center'; // Default to center for consistent centering

        if (stretchMode) {
            // Stretch to fill window dynamically
            sx = window.innerWidth / width;
            sy = window.innerHeight / height;
            transformOrigin = 'top left'; // Stretch needs to start from top left
        }

        // Apply styles to the body.
        // The flexbox properties will center the 'logical' body (before transform).
        // The transform-origin: center center will ensure the scaling happens from the center.
        document.body.style.cssText = `
            transform: scale(${sx}, ${sy});
            transform-origin: ${transformOrigin};
            width: ${width}px;
            height: ${height}px;
            margin: auto; /* Use auto margins for centering the scaled element */
            background: black;
            overflow: hidden;

            /* Flexbox centering for the body element itself within the viewport */
            position: fixed; /* Fix position to ensure it's centered relative to viewport */
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(${sx}, ${sy}); /* Center then scale */
            transform-origin: center center; /* Always scale from center for fixed position */
            width: ${width}px;
            height: ${height}px;
            background: black;
            overflow: hidden;
            display: block; /* No longer need flex on body itself for centering after transform */
        `;

        // We need to re-evaluate the centering strategy.
        // Applying transform directly to body with fixed position and translate(-50%,-50%)
        // is the most robust way to center a scaled element on the screen.
        // Let's refine this to make it cleaner and more reliable.

        document.body.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(${sx}, ${sy}); /* Center first, then scale */
            transform-origin: center center; /* Always scale from the center point */
            width: ${width}px;
            height: ${height}px;
            background-color: black;
            overflow: hidden;
            margin: 0; /* Remove margin as transform handles positioning */
        `;

        // If stretch mode, override transform for full window fill
        if (stretchMode) {
             document.body.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                transform: none; /* No scaling transform needed, just fill */
                background-color: black;
                overflow: hidden;
                margin: 0;
            `;
            // For stretch, we actually want the content *inside* the body to stretch.
            // The game itself is usually in an iframe or canvas within the body.
            // The original script's approach of scaling the body itself might cause issues
            // with other elements. Let's assume the game content itself will adapt to 100% width/height of body.
            // If it doesn't, we'd need to target the game's actual element.
            // For now, let's revert to the original `transform` approach but ensure centering.
            document.body.style.cssText = `
                transform: scale(${window.innerWidth / width}, ${window.innerHeight / height});
                transform-origin: top left;
                width: ${width}px;
                height: ${height}px;
                margin: 0;
                background: black;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
        } else {
             document.body.style.cssText = `
                transform: scale(${sx}, ${sy});
                transform-origin: center center; /* Consistent center origin for non-stretch */
                width: ${width}px;
                height: ${height}px;
                background: black;
                overflow: hidden;

                /* Centering the scaled content within the viewport */
                position: absolute; /* Changed from fixed to absolute, combined with top/left/transform for centering */
                top: 50%;
                left: 50%;
                margin-right: -50%;
                transform: translate(-50%, -50%) scale(${sx}, ${sy}); /* Translate back by half its size, then scale */
            `;
        }


        lastResolution = { width, height, sx: scaleX, sy: scaleY };
    }


    // --- CS 1.6 Resolutions (exact scales + new ones) ---
    const resolutions = [
        // Original resolutions
        { label: "640x480", w: 640, h: 480, sx: 3.00, sy: 2.25 },
        { label: "800x600", w: 800, h: 600, sx: 2.40, sy: 1.80 },
        { label: "1024x768", w: 1024, h: 768, sx: 1.88, sy: 1.41 },
        { label: "1280x960", w: 1280, h: 960, sx: 1.50, sy: 1.12 },
        { label: "1440x1080", w: 1440, h: 1080, sx: 1.33, sy: 1.00 },
        { label: "1920x1080 (Native)", w: 1920, h: 1080, sx: 1.00, sy: 1.00 },

        // Common scales
        { label: "1280x720 (HD Ready)", w: 1280, h: 720, sx: 1.50, sy: 1.50 }, // Example: wider screen, scaled
        { label: "1366x768 (Laptop Std)", w: 1366, h: 768, sx: 1.40, sy: 1.40 },

        // Smaller scales for large displays, still centered
        { label: "2560x1440 (Scaled 0.75)", w: 2560, h: 1440, sx: 0.75, sy: 0.75 },
        { label: "3840x2160 (Scaled 0.5)", w: 3840, h: 2160, sx: 0.5, sy: 0.5 },

        // Custom aspect ratios / non-standard scales
        { label: "1600x900 (Wider Scale)", w: 1600, h: 900, sx: 1.2, sy: 1.2 },
        { label: "1680x1050 (16:10 Scale)", w: 1680, h: 1050, sx: 1.14, sy: 1.14 },

        { label: "1920x1080 (Shrunk 0.8)", w: 1920, h: 1080, sx: 0.8, sy: 1.0 },
    ];

    // --- Populate resolution menu ---
    // The forEach loop doesn't need 'transformOrigin' anymore as it's handled internally by applyResolution
    resolutions.forEach(({ label, w, h, sx, sy }) => {
        const option = document.createElement("div");
        option.className = "resolution-option";
        option.textContent = label;
        option.addEventListener("click", () => {
            applyResolution(w, h, sx, sy); // No transformOrigin needed here
            resolutionMenu.style.display = "none";
        });
        resolutionMenu.appendChild(option);
    });

    // --- Toggle Stretch Option ---
    const stretchOption = document.createElement("div");
    stretchOption.className = "resolution-option";
    stretchOption.textContent = "Toggle Stretch (OFF)";
    stretchOption.addEventListener("click", () => {
        stretchMode = !stretchMode;
        stretchOption.textContent = `Toggle Stretch (${stretchMode ? "ON" : "OFF"})`;

        // Re-apply last resolution immediately
        if (lastResolution) {
            applyResolution(lastResolution.width, lastResolution.height, lastResolution.sx, lastResolution.sy);
        }
    });
    resolutionMenu.appendChild(stretchOption);

    // --- Reset option ---
    const resetOption = document.createElement("div");
    resetOption.className = "resolution-option";
    resetOption.textContent = "Reset (Default)";
    resetOption.addEventListener("click", () => {
        document.body.style.cssText = ""; // Clear all custom styles
        resolutionMenu.style.display = "none";
        lastResolution = null;
        stretchMode = false; // Reset stretch mode on default
        stretchOption.textContent = `Toggle Stretch (OFF)`;
    });
    resolutionMenu.appendChild(resetOption);

    // --- CSS Styles ---
    const style = document.createElement("style");
    style.textContent = `
    .resolution-button {
        position: fixed;
        top: 50px;
        right: 100px;
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
        transition: background 0.2s;
    }
    .resolution-button:hover {
        background: rgba(0,0,0,0.9);
    }
    .resolution-menu {
        position: fixed;
        top: 150px;
        right: 0;
        background: rgba(0,0,0,0.85);
        border-radius: 5px;
        padding: 10px;
        z-index: 10000;
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
            resolutionBtn.style.display = resolutionBtn.style.display === "none" ? "block" : "none";
        }
    });

    // --- Toggle Menu ---
    resolutionBtn.addEventListener("click", () => {
        resolutionMenu.style.display = resolutionMenu.style.display === "none" ? "flex" : "none";
    });

})();
