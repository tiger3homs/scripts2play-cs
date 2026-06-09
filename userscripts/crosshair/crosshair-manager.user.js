// ==UserScript==
// @name         CS Crosshair
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Optimized static line-style crosshair with customizable settings, profiles, shadow, border, and UI panel visibility toggled by Alt+Shift+Z, also managing PointerLock.
// @author       Tiger3homs aka (obbe.00 on discord) - Refactored by AI Assistant
// @match        https://game.play-cs.com/*
// @icon         https://play-cs.com/img/favicon.png
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'customCrosshairConfigV3'; // Changed storage key for V3
    const UI_PANEL_TOGGLE_KEY_CODE = 'KeyZ';
    const UI_PANEL_TOGGLE_MODIFIERS = { alt: true, shift: true };

    // Default settings for a single crosshair profile
    const DEFAULT_PROFILE_SETTINGS = {
        length: 10,
        thickness: 2,
        gap: 4,
        color: '#ffffff',
        opacity: 1.0,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowBlur: 2,
        shadowX: 1,
        shadowY: 1,
        borderEnabled: false,
        borderColor: '#000000',
        borderThickness: 1,
    };

    // Global configuration structure
    const DEFAULT_CONFIG = {
        profiles: {
            'Default': { ...DEFAULT_PROFILE_SETTINGS }
        },
        currentProfileName: 'Default',
        enabled: true, // Global ON/OFF for the entire custom crosshair system
        menuVisible: false,
        uiPanelVisible: false, // This now refers to the new single button's visibility
        gameWasPointerLocked: false
    };

    class CrosshairManager {
        constructor() {
            this.config = this.loadConfig();
            this.elements = {};
            this.setupDOM();
            this.injectStyles();
            this.setupEventListeners();
            this.initializeUI();
            this.renderCrosshair();
        }

        // --- Configuration Management ---
        loadConfig() {
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

                if (saved && typeof saved === 'object' && saved.profiles) {
                    // Ensure all profiles have default settings merged in case new properties are added
                    for (const profileName in saved.profiles) {
                        saved.profiles[profileName] = { ...DEFAULT_PROFILE_SETTINGS, ...saved.profiles[profileName] };
                    }
                    // Ensure the currentProfileName is valid, or fall back to 'Default'
                    if (!saved.profiles[saved.currentProfileName]) {
                        saved.currentProfileName = Object.keys(saved.profiles)[0] || 'Default';
                        if (!saved.profiles[saved.currentProfileName]) { // If no profiles exist
                            saved.profiles = { 'Default': { ...DEFAULT_PROFILE_SETTINGS } };
                            saved.currentProfileName = 'Default';
                        }
                    }
                    return { ...DEFAULT_CONFIG, ...saved }; // Merge global settings
                }
                console.warn("Invalid or old crosshair config detected, using defaults.");
                return { ...DEFAULT_CONFIG }; // Fallback to full defaults if structure is old or invalid
            } catch (e) {
                console.error("Failed to load crosshair config, using defaults.", e);
                return { ...DEFAULT_CONFIG };
            }
        }

        saveConfig() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        }

        resetConfig() {
            if (!confirm('Are you sure you want to reset ALL crosshair settings and profiles to default? This cannot be undone.')) {
                return;
            }
            this.config = { ...DEFAULT_CONFIG }; // Reset to initial default structure
            this.saveConfig();
            this.initializeUI(); // Re-render UI with default values
            this.renderCrosshair();
        }

        // --- Profile Management ---
        get currentProfile() {
            // Ensure the current profile actually exists before returning it
            if (!this.config.profiles[this.config.currentProfileName]) {
                // This should ideally not happen if loadConfig works correctly,
                // but as a failsafe, revert to 'Default' if the current profile is somehow missing.
                console.warn(`Current profile '${this.config.currentProfileName}' not found. Reverting to 'Default'.`);
                this.config.currentProfileName = 'Default';
                if (!this.config.profiles['Default']) { // Ensure 'Default' also exists
                    this.config.profiles['Default'] = { ...DEFAULT_PROFILE_SETTINGS };
                }
                this.saveConfig();
                this.updateMenuProfileSelector();
            }
            return this.config.profiles[this.config.currentProfileName];
        }

        addProfile(name) {
            if (this.config.profiles[name]) {
                alert(`A profile named '${name}' already exists.`);
                return false;
            }
            this.config.profiles[name] = { ...this.currentProfile }; // Clone current settings
            this.config.currentProfileName = name;
            this.saveConfig();
            this.initializeUI(); // Rebuild UI to reflect new profile and selection
            this.renderCrosshair();
            return true;
        }

        deleteProfile(name) {
            if (Object.keys(this.config.profiles).length <= 1) {
                alert('Cannot delete the last remaining profile.');
                return false;
            }
            if (name === 'Default') {
                alert('The "Default" profile cannot be deleted.');
                return false;
            }
            if (!confirm(`Are you sure you want to delete profile '${name}'?`)) {
                return false;
            }

            delete this.config.profiles[name];
            if (this.config.currentProfileName === name) {
                this.config.currentProfileName = 'Default'; // Switch to default if active profile deleted
            }
            this.saveConfig();
            this.initializeUI();
            this.renderCrosshair();
            return true;
        }

        renameProfile(oldName, newName) {
            if (newName === oldName) return;
            if (this.config.profiles[newName]) {
                alert(`A profile named '${newName}' already exists.`);
                return false;
            }
            if (oldName === 'Default') {
                alert('The "Default" profile cannot be renamed.');
                return false;
            }
            if (!confirm(`Rename profile '${oldName}' to '${newName}'?`)) {
                return false;
            }

            this.config.profiles[newName] = this.config.profiles[oldName];
            delete this.config.profiles[oldName];
            if (this.config.currentProfileName === oldName) {
                this.config.currentProfileName = newName;
            }
            this.saveConfig();
            this.initializeUI();
            this.renderCrosshair();
            return true;
        }

        // --- DOM & Styles ---
        setupDOM() {
            // Crosshair Container and Lines
            this.elements.crosshairContainer = document.createElement('div');
            this.elements.crosshairContainer.id = 'custom-crosshair-lines';
            this.elements.crosshairContainer.innerHTML = `
                <div class="crosshair-line crosshair-line-top"></div>
                <div class="crosshair-line crosshair-line-bottom"></div>
                <div class="crosshair-line crosshair-line-left"></div>
                <div class="crosshair-line crosshair-line-right"></div>
            `;
            document.body.appendChild(this.elements.crosshairContainer);

            // Menu Panel
            this.elements.menu = document.createElement('div');
            this.elements.menu.id = 'custom-crosshair-menu';
            document.body.appendChild(this.elements.menu);

            // NEW: Crosshair UI Button
            this.elements.crosshairBtn = document.createElement("a");
            this.elements.crosshairBtn.className = "user-button crosshair-button";
            this.elements.crosshairBtn.title = "Crosshair";
            this.elements.crosshairBtn.innerHTML = `<i class="fa fa-crosshairs"></i>`;
            document.body.appendChild(this.elements.crosshairBtn); // Initial display will be set by updateUIPanelVisibility
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                #custom-crosshair-lines {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 9998;
                    display: ${this.config.enabled ? 'block' : 'none'};
                }
                .crosshair-line {
                    position: absolute;
                    background-color: var(--ch-color, #ffffff);
                    opacity: var(--ch-opacity, 1.0);
                    pointer-events: none;
                    box-shadow: var(--ch-box-shadow, none); /* Shadow effect */
                    outline: var(--ch-outline, none); /* Border effect using outline */
                }
                .crosshair-line-top {
                    width: var(--ch-thickness, 2px);
                    height: var(--ch-length, 10px);
                    top: calc(50% - var(--ch-gap, 4px) - var(--ch-length, 10px));
                    left: calc(50% - var(--ch-thickness, 2px) / 2);
                }
                .crosshair-line-bottom {
                    width: var(--ch-thickness, 2px);
                    height: var(--ch-length, 10px);
                    top: calc(50% + var(--ch-gap, 4px));
                    left: calc(50% - var(--ch-thickness, 2px) / 2);
                }
                .crosshair-line-left {
                    width: var(--ch-length, 10px);
                    height: var(--ch-thickness, 2px);
                    top: calc(50% - var(--ch-thickness, 2px) / 2);
                    left: calc(50% - var(--ch-gap, 4px) - var(--ch-length, 10px));
                }
                .crosshair-line-right {
                    width: var(--ch-length, 10px);
                    height: var(--ch-thickness, 2px);
                    top: calc(50% - var(--ch-thickness, 2px) / 2);
                    left: calc(50% + var(--ch-gap, 4px));
                }

                /* Menu Styles */
                #custom-crosshair-menu {
                    position: fixed;
                    top: 100px;
                    right: 10px;
                    background: rgba(34, 34, 34, 0.95);
                    color: #fff;
                    padding: 10px;
                    border: 1px solid #555;
                    border-radius: 5px;
                    z-index: 99999;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 12px;
                    width: 250px; /* Slightly wider for new controls */
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    display: ${this.config.menuVisible ? 'block' : 'none'};
                    max-height: 95vh;
                    overflow-y: auto;
                }
                #custom-crosshair-menu h3 {
                    margin-top: 0;
                    margin-bottom: 10px;
                    color: #4CAF50;
                    text-align: center;
                }
                .crosshair-menu-control {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .crosshair-menu-control label {
                    flex-grow: 1;
                    margin-right: 5px;
                }
                .crosshair-menu-control input[type="range"] {
                    flex-grow: 2;
                    width: auto;
                    margin: 0 5px;
                }
                .crosshair-menu-control input[type="number"],
                .crosshair-menu-control input[type="color"],
                .crosshair-menu-control select {
                    width: 60px;
                    border: 1px solid #444;
                    background: #333;
                    color: #fff;
                    padding: 2px;
                    border-radius: 3px;
                }
                 .crosshair-menu-control input[type="checkbox"] {
                    margin-left: auto;
                 }
                .value-display {
                    min-width: 25px;
                    text-align: right;
                }
                #custom-crosshair-menu ul {
                    list-style: none;
                    padding: 0;
                    margin-top: 10px;
                    border-top: 1px solid #444;
                    padding-top: 10px;
                }
                #custom-crosshair-menu li {
                    margin-bottom: 5px;
                    display: flex;
                    justify-content: space-between;
                }
                #custom-crosshair-menu kbd {
                    background-color: #eee;
                    color: #333;
                    padding: 2px 4px;
                    border-radius: 3px;
                    border: 1px solid #bbb;
                    font-family: monospace;
                }

                /* Profile Management Styles */
                .profile-manager {
                    border-top: 1px solid #444;
                    padding-top: 10px;
                    margin-top: 10px;
                }
                .profile-selector-group, .profile-action-group {
                    display: flex;
                    gap: 5px;
                    margin-bottom: 8px;
                    align-items: center;
                }
                .profile-selector-group select {
                    flex-grow: 1;
                    width: auto; /* Override default 60px */
                }
                .profile-action-group button {
                    flex: 1;
                    padding: 5px 8px;
                    font-size: 11px;
                    border-radius: 3px;
                    background-color: #5cb85c;
                }
                .profile-action-group button.secondary { background-color: #f0ad4e; }
                .profile-action-group button.danger { background-color: #d9534f; }
                .profile-action-group button:hover { opacity: 0.9; }

                /* NEW: Crosshair Button Styles */
                .crosshair-button {
                    z-index: 13;
            display: none; /* Use flexbox for centering icon and text */
                    top: 50px; /* slightly below fullscreen button */
                    right: 0;
                    position: fixed;
                    font-family: '94cda963bd2cf599314fe42bc8bc131c093a88bc8d1ac5c378c70385c8d18fcb';
                    color: #ff004c;
                    text-decoration: none;
  padding: 10px 15px;
                    margin: 10px;
                    background: rgba(0,0,0,0.7);
                    cursor: pointer;
  border-radius: 5px;
  transition: background 0.2s;
                }
                .crosshair-button i {
            /* margin-right: 5px; Removed as we want just the cog icon */
                }
                .crosshair-button:hover {
                    background: rgba(0,0,0,0.9);
                }
            `;
            document.head.appendChild(style);
        }

        applyCrosshairStyles() {
            const profile = this.currentProfile;
            if (!profile) return; // Should not happen with currentProfile getter logic

            document.documentElement.style.setProperty('--ch-length', `${profile.length}px`);
            document.documentElement.style.setProperty('--ch-thickness', `${profile.thickness}px`);
            document.documentElement.style.setProperty('--ch-gap', `${profile.gap}px`);
            document.documentElement.style.setProperty('--ch-color', profile.color);
            document.documentElement.style.setProperty('--ch-opacity', profile.opacity);

            // Apply shadow styles
            if (profile.shadowEnabled) {
                document.documentElement.style.setProperty('--ch-box-shadow',
                    `${profile.shadowX}px ${profile.shadowY}px ${profile.shadowBlur}px ${profile.shadowColor}`);
            } else {
                document.documentElement.style.setProperty('--ch-box-shadow', 'none');
            }

            // Apply border styles using outline
            if (profile.borderEnabled) {
                document.documentElement.style.setProperty('--ch-outline',
                    `${profile.borderThickness}px solid ${profile.borderColor}`);
            } else {
                document.documentElement.style.setProperty('--ch-outline', 'none');
            }
        }

        renderCrosshair() {
            this.elements.crosshairContainer.style.display = this.config.enabled ? 'block' : 'none';
            this.applyCrosshairStyles();
        }

        // --- UI Interactions ---
        toggleCrosshair = () => { // This method is now unused for direct UI button, but kept for menu checkbox
            this.config.enabled = !this.config.enabled;
            this.saveConfig();
            this.renderCrosshair();
            // No direct button to update here anymore, only the menu checkbox
        }

        toggleMenu = () => {
            this.config.menuVisible = !this.config.menuVisible;
            this.elements.menu.style.display = this.config.menuVisible ? 'block' : 'none';
            this.saveConfig();
            // No direct button to update here anymore
        }

        createMenuControl(parent, labelText, type, key, options = {}) {
            const wrapper = document.createElement('div');
            wrapper.className = 'crosshair-menu-control';

            const label = document.createElement('label');
            label.textContent = `${labelText}: `;
            wrapper.appendChild(label);

            const input = document.createElement('input');
            input.type = type;
            // Use currentProfile for values, and update currentProfile for changes
            input.value = this.currentProfile[key];

            if (type === 'range') {
                input.min = options.min;
                input.max = options.max;
                input.step = options.step;
                const valueDisplay = document.createElement('span');
                valueDisplay.textContent = this.currentProfile[key];
                valueDisplay.className = 'value-display';
                input.oninput = () => {
                    this.currentProfile[key] = parseFloat(input.value);
                    valueDisplay.textContent = input.value;
                    this.saveConfig();
                    this.renderCrosshair();
                };
                wrapper.appendChild(input);
                wrapper.appendChild(valueDisplay);
            } else if (type === 'color' || type === 'number') {
                input.oninput = () => {
                    this.currentProfile[key] = input.value;
                    this.saveConfig();
                    this.renderCrosshair();
                };
                wrapper.appendChild(input);
            } else if (type === 'checkbox') {
                input.checked = this.currentProfile[key];
                input.onchange = () => {
                    this.currentProfile[key] = input.checked;
                    this.saveConfig();
                    this.renderCrosshair();
                };
                wrapper.appendChild(input);
            }
            parent.appendChild(wrapper);
        }

        setupMenu() {
            const menu = this.elements.menu;
            menu.innerHTML = `<h3>Crosshair Config</h3>`;

            // --- Profile Management ---
            const profileManagerDiv = document.createElement('div');
            profileManagerDiv.className = 'profile-manager';
            profileManagerDiv.innerHTML = `
                <div class="crosshair-menu-control">
                    <label>Current Profile:</label>
                    <select id="profile-selector"></select>
                </div>
                <div class="profile-action-group">
                    <button id="add-profile-btn" class="secondary">Save New</button>
                    <button id="rename-profile-btn" class="secondary">Rename</button>
                    <button id="delete-profile-btn" class="danger">Delete</button>
                </div>
            `;
            menu.appendChild(profileManagerDiv);

            this.elements.profileSelector = profileManagerDiv.querySelector('#profile-selector');
            this.elements.addProfileBtn = profileManagerDiv.querySelector('#add-profile-btn');
            this.elements.renameProfileBtn = profileManagerDiv.querySelector('#rename-profile-btn');
            this.elements.deleteProfileBtn = profileManagerDiv.querySelector('#delete-profile-btn');

            this.elements.profileSelector.onchange = (e) => {
                this.config.currentProfileName = e.target.value;
                this.saveConfig();
                this.initializeUI(); // Re-render menu controls with new profile's values
                this.renderCrosshair();
            };

            this.elements.addProfileBtn.onclick = () => {
                const newName = prompt('Enter name for new profile (will copy current settings):');
                if (newName && newName.trim() !== '') {
                    this.addProfile(newName.trim());
                }
            };

            this.elements.renameProfileBtn.onclick = () => {
                const currentName = this.config.currentProfileName;
                if (currentName === 'Default') {
                    alert('The "Default" profile cannot be renamed.');
                    return;
                }
                const newName = prompt(`Rename '${currentName}' to:`, currentName);
                if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
                    this.renameProfile(currentName, newName.trim());
                }
            };

            this.elements.deleteProfileBtn.onclick = () => {
                this.deleteProfile(this.config.currentProfileName);
            };

            this.updateMenuProfileSelector();


            // --- Basic Crosshair Settings ---
            const settingsDiv = document.createElement('div');
            menu.appendChild(settingsDiv);

            this.createMenuControl(settingsDiv, 'Length', 'range', 'length', { min: 1, max: 50, step: 1 });
            this.createMenuControl(settingsDiv, 'Thickness', 'range', 'thickness', { min: 1, max: 10, step: 1 });
            this.createMenuControl(settingsDiv, 'Gap', 'range', 'gap', { min: 0, max: 30, step: 1 });
            this.createMenuControl(settingsDiv, 'Color', 'color', 'color');
            this.createMenuControl(settingsDiv, 'Opacity', 'range', 'opacity', { min: 0.1, max: 1.0, step: 0.05 });

            // --- Shadow Settings ---
            const shadowSection = document.createElement('div');
            this.createMenuControl(shadowSection, 'Enable Shadow', 'checkbox', 'shadowEnabled');
            this.createMenuControl(shadowSection, 'Shadow Color', 'color', 'shadowColor');
            this.createMenuControl(shadowSection, 'Blur Radius', 'range', 'shadowBlur', { min: 0, max: 10, step: 1 });
            this.createMenuControl(shadowSection, 'Offset X', 'range', 'shadowX', { min: -10, max: 10, step: 1 });
            this.createMenuControl(shadowSection, 'Offset Y', 'range', 'shadowY', { min: -10, max: 10, step: 1 });
            menu.appendChild(shadowSection);

            // --- Border Settings ---
            const borderSection = document.createElement('div');

            this.createMenuControl(borderSection, 'Enable Border', 'checkbox', 'borderEnabled');
            this.createMenuControl(borderSection, 'Border Color', 'color', 'borderColor');
            this.createMenuControl(borderSection, 'Border Thickness', 'range', 'borderThickness', { min: 1, max: 5, step: 1 });
            menu.appendChild(borderSection);

            // --- Global Controls ---
            const enableWrapper = document.createElement('div');
            enableWrapper.className = 'crosshair-menu-control';
            enableWrapper.style.marginTop = '15px';
            enableWrapper.style.borderTop = '1px solid #444';
            enableWrapper.style.paddingTop = '10px';
            const enableLabel = document.createElement('label');
            enableLabel.textContent = 'Enable Custom Crosshair (Global): ';
            const enableInput = document.createElement('input');
            enableInput.type = 'checkbox';
            enableInput.checked = this.config.enabled;
            enableInput.onchange = this.toggleCrosshair;
            enableLabel.appendChild(enableInput); // Checkbox is inside label for better click area
            enableWrapper.appendChild(enableLabel);
            menu.appendChild(enableWrapper);

            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset All to Defaults';
            resetButton.style.cssText = 'width: 100%; margin-top: 15px; padding: 6px; background-color: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;';
            resetButton.onmouseover = (e) => e.target.style.backgroundColor = '#d32f2f';
            resetButton.onmouseout = (e) => e.target.style.backgroundColor = '#f44336';
            resetButton.onclick = () => {
                this.resetConfig();
            };
            menu.appendChild(resetButton);


            const keybinds = document.createElement('div');
            keybinds.innerHTML = `<p style="margin-top: 15px; border-top: 1px solid #444; padding-top: 10px;">Keybinds:</p>
                                  <ul>
                                    <li>Toggle Crosshair Button & Pointer Lock: <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></li>
                                  </ul>`;
            menu.appendChild(keybinds);

            const footer = document.createElement('div');
            footer.style.marginTop = '15px';
            footer.style.borderTop = '1px solid #444';
            footer.style.paddingTop = '10px';
            footer.style.textAlign = 'center';
            footer.innerHTML = `<a href="https://github.com/tiger3homs/"
                                   target="_blank"
                                   style="color:#4CAF50; text-decoration:none;">
                                    obbe.00 on discord
                                </a>`;
            menu.appendChild(footer);

        };

        updateMenuProfileSelector() {
            const selector = this.elements.profileSelector;
            if (selector) {
                selector.innerHTML = ''; // Clear existing options
                const profileNames = Object.keys(this.config.profiles).sort();
                profileNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    selector.appendChild(option);
                });
                selector.value = this.config.currentProfileName; // Set selected option
            }

            // Disable delete/rename for 'Default' profile
            if (this.config.currentProfileName === 'Default' || Object.keys(this.config.profiles).length <= 1) {
                this.elements.deleteProfileBtn.disabled = true;
                this.elements.renameProfileBtn.disabled = true;
            } else {
                this.elements.deleteProfileBtn.disabled = false;
                this.elements.renameProfileBtn.disabled = false;
            }
        }

        // REMOVED: setupUIControlPanel as it's replaced by the single crosshairBtn
        // REMOVED: updateUIControlPanel as it's replaced by the single crosshairBtn

        updateUIPanelVisibility() {
            // Now controls the visibility of the single crosshairBtn
            this.elements.crosshairBtn.style.display = this.config.uiPanelVisible ? 'block' : 'none';
            // Also ensure the menu respects its own config, regardless of button visibility
            this.elements.menu.style.display = this.config.menuVisible ? 'block' : 'none';
        }

        toggleUIPanelAndPointerLock = (event) => {
            if (event) event.preventDefault();

            // Toggle the visibility state of the button
            this.config.uiPanelVisible = !this.config.uiPanelVisible;
            this.updateUIPanelVisibility();
            this.saveConfig();

            if (this.config.uiPanelVisible) {
                // If button is now visible (UI is "open")
                if (document.pointerLockElement) {
                    this.config.gameWasPointerLocked = true;
                    document.exitPointerLock();
                } else {
                    this.config.gameWasPointerLocked = false;
                }
                // When the button appears, ensure the menu also appears if it was meant to be visible
                if (this.config.menuVisible) {
                     this.elements.menu.style.display = 'block';
                }
            } else {
                // If button is now hidden (UI is "closed")
                // Hide the menu too, regardless of its previous state
                this.config.menuVisible = false;
                this.elements.menu.style.display = 'none';
                if (this.config.gameWasPointerLocked) {
                    const gameCanvas = document.querySelector('canvas');
                    if (gameCanvas) {
                        gameCanvas.requestPointerLock().catch(e => console.error("Failed to request pointer lock:", e));
                    } else {
                        document.body.requestPointerLock().catch(e => console.error("Failed to request pointer lock on body:", e));
                    }
                }
                this.config.gameWasPointerLocked = false;
            }
            this.saveConfig();
        }

        // NEW: Handler for clicking the new crosshair button
        handleCrosshairButtonClick = () => {
            this.config.menuVisible = !this.config.menuVisible;
            this.elements.menu.style.display = this.config.menuVisible ? 'block' : 'none';
            this.saveConfig();
        }

        handlePointerLockChange = () => {
            if (!document.pointerLockElement && this.config.gameWasPointerLocked && !this.config.uiPanelVisible) {
                // If pointer lock was active but is now gone, and UI *button* is not visible,
                // it means user exited manually (e.g., Esc). We should not try to re-lock immediately.
                this.config.gameWasPointerLocked = false;
                this.saveConfig();
            }
        }

        debounce(func, delay) {
            let timer;
            return function(...args) {
                clearTimeout(timer);
                timer = setTimeout(() => func.apply(this, args), delay);
            };
        }

        setupEventListeners() {
            document.addEventListener('keydown', (event) => {
                if (event.code === UI_PANEL_TOGGLE_KEY_CODE &&
                    event.altKey === UI_PANEL_TOGGLE_MODIFIERS.alt &&
                    event.shiftKey === UI_PANEL_TOGGLE_MODIFIERS.shift &&
                    !event.repeat) {
                    this.toggleUIPanelAndPointerLock(event);
                }
            });

            // NEW: Add click listener for the new crosshair button
            this.elements.crosshairBtn.addEventListener('click', this.handleCrosshairButtonClick);

            document.addEventListener('pointerlockchange', this.debounce(this.handlePointerLockChange, 50)); // Debounce to prevent rapid false positives

            window.addEventListener('resize', this.debounce(() => {
                this.renderCrosshair();
            }, 100));
        }

        initializeUI() {
            this.setupMenu(); // Rebuilds the entire menu including profile selector and controls
            // Replaced setupUIControlPanel with logic for the new single button
            this.updateUIPanelVisibility(); // Set initial visibility of the crosshairBtn
            this.elements.menu.style.display = this.config.menuVisible ? 'block' : 'none'; // Ensure menu visibility is also set
        }
    }

    // Initialize the manager
    new CrosshairManager();

})();
