// ==UserScript==
// @name         Play-CS Targeted HUD Editor
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Only allows editing the Spectator HUD text
// @author       Gemini
// @match        https://game.play-cs.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let isEditing = false;
    const AUTO_TEXT = "TYPE YOUR CUSTOM TEXT HERE";

    // --- 1. TARGETED EDITING LOGIC ---
    const toggleHudEdit = (enable) => {
        const hud = document.querySelector('.hud-in-specmode');
        if (!hud) return;

        if (enable) {
            // Set the custom text if it's the first time
            if (!hud.dataset.edited) {
                // We target the first text node specifically to avoid deleting the ads div
                hud.childNodes[0].textContent = AUTO_TEXT;
                hud.dataset.edited = "true";
            }
            
            // Make ONLY this element editable
            hud.contentEditable = "true";
            hud.style.outline = "2px dashed #ff3e3e"; // Visual cue
            hud.focus();
        } else {
            hud.contentEditable = "false";
            hud.style.outline = "none";
        }
    };

    // --- 2. INPUT BLOCKER ---
    const stopPropagation = (e) => {
        if (isEditing) {
            // If the user is typing in the HUD, don't let the game see the keys
            e.stopImmediatePropagation();
        }
    };

    // --- 3. TOGGLE LOGIC (Alt + W) ---
    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyW') {
            isEditing = !isEditing;
            
            if (isEditing) {
                document.exitPointerLock();
                toggleHudEdit(true);
                showNotification("HUD EDITING: ON");
                
                window.addEventListener('keydown', stopPropagation, true);
                window.addEventListener('keyup', stopPropagation, true);
            } else {
                toggleHudEdit(false);
                showNotification("HUD EDITING: OFF");
                
                window.removeEventListener('keydown', stopPropagation, true);
                window.removeEventListener('keyup', stopPropagation, true);
            }
        }
    }, true);

    // --- 4. HUD WATCHER ---
    // This ensures that if the game refreshes the HUD, we re-apply our changes
    const observer = new MutationObserver(() => {
        if (isEditing) toggleHudEdit(true);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // --- 5. UI HELPER ---
    function showNotification(text) {
        let el = document.getElementById('edit-indicator');
        if (!el) {
            el = document.createElement('div');
            el.id = 'edit-indicator';
            Object.assign(el.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '10px 20px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                borderRadius: '5px',
                zIndex: '2147483647',
                fontFamily: 'monospace',
                pointerEvents: 'none'
            });
            document.body.appendChild(el);
        }
        el.innerText = text;
        el.style.display = isEditing ? 'block' : 'none';
    }
})();
