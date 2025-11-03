// ==UserScript==
// @name         CS Server Manager
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Transform your play-cs.com/myservers page into a powerful, organized server management hub.
// @author       tiger3homs aka (obbe.00) on discord
// @match        https://play-cs.com/myservers
// @match        https://play-cs.com/*/myservers
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. CONFIGURATION & CONSTANTS ---

    const CONFIG = {
        mainFormId: 'my-servers-form',
        colors: [15158332, 3066993, 3447003, 15105570, 10181046, 16776960], // Red, Green, Blue, Orange, Purple, Yellow
        originalTableSelector: 'table.table',
        serverRowClass: 'myserver',
        globalSaveButtonClass: 'save-btn3',
        cardContainerId: 'server-cards-container',
        SELECTORS: {
            serverNameInput: (id) => `input[name="server[${id}][name]"]`,
            serverEnabledCheckbox: (id) => `input[id="server[${id}][enabled]"]`,
            serverPublicCheckbox: (id) => `input[id="server[${id}][public]"]`,
            cvarCheckbox: (id, cvarName) => `input[id="server[${id}][cvars][${cvarName}]"]`,
            cvarSelect: (id, cvarName) => `select[name="server[${id}][cvars][${cvarName}]"]`,
            serverLink: (id) => `tr[data-server="${id}"] a[target="_blank"]`,
        },
        css: `
            /* Card Layout */
            #my-servers-tab .myservers-card {
    background: linear-gradient(135deg, rgba(5, 18, 36, 0.88), rgba(12, 49, 87, 0.78));
    border-radius: 18px;
    border: 1px solid rgba(55, 184, 255, 0.22);
    padding: 26px;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}
            .server-card { background-color: #2a2a2a; border: 1px solid #444; border-radius: 8px; margin-bottom: 15px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); font-family: Arial, sans-serif; color: #ccc; overflow: hidden; }
            .server-card-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding-bottom: 10px; border-bottom: 1px solid #333; margin-bottom: 10px; transition: background-color 0.2s; }
            .server-card-header:hover { background-color: #333; border-radius: 5px; padding: 5px 10px; margin: -5px -10px 5px; }
            .server-card-header h4 { margin: 0; color: #eee; font-size: 1.2em; }
            .server-card-summary { display: flex; gap: 20px; font-size: 0.9em; color: #bbb; }
            .server-card-summary span { display: flex; align-items: center; gap: 5px; }
            .toggle-icon { font-size: 1.2em; transition: transform 0.2s; }
            .server-card-header.expanded .toggle-icon { transform: rotate(90deg); }
            .server-card-details { display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; overflow-x: auto; }

            /* Details Table */
            .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .details-table th, .details-table td { border: 1px solid #444; padding: 8px; text-align: left; font-size: 0.9em; vertical-align: top; }
            .details-table th { background-color: #333; }
            .details-table td, .myserver { background-color: #222; }

            /* Form Elements */
            :where(input[type="text"], select, .input_dark) { background-color: #333 !important; border: 1px solid #555 !important; color: #eee !important; padding: 5px; border-radius: 4px; width: calc(100% - 12px); box-sizing: border-box; }
            :is(.save-btn, .save-btn2, .admin_add_button) { background-color: #007bff; color: white !important; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin: 5px 5px 0 0; text-decoration: none !important; display: inline-block; font-size: 0.9em; }
            :is(.save-btn, .save-btn2):hover { background-color: #0056b3; }
            .admin_add_button { background-color: #4CAF50; }
            .admin_add_button:hover { background-color: #45a049; }

            /* Server Controls */
            .server-controls { background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 15px; }
            .control-group { display: flex; align-items: center; gap: 10px; }
            .control-group label { cursor: pointer; background-color: #333; border: 1px solid #555; border-radius: 5px; padding: 7px 10px; transition: background-color 0.2s; font-size: 0.9em; }
            .control-group input[type="radio"] { display: none; }
            .control-group input[type="radio"]:checked + label { background-color: #007bff; border-color: #007bff; color: white; font-weight: bold; }

            /* Map Picker */
            .control-map { display: flex; align-items: center; gap: 10px; }
            .map-picker { display: flex; gap: 5px; flex-wrap: wrap; }
            .map-picker img { width: 100px; height: 40px; cursor: pointer; border: 2px solid transparent; border-radius: 5px; transition: border-color 0.2s; object-fit: cover; background-color: #2a2a2a; }
            .map-picker img:hover { border-color: #00aaff; }
            .map-picker img.selected { border-color: #007bff; box-shadow: 0 0 5px #007bff; }

            .action-buttons { display: flex; gap: 10px; width: 100%; justify-content: flex-end; }
            .action-buttons button { color: white; padding: 9px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; }
            .action-buttons button:hover { background-color: #0056b3; }
            .discord-btn { background-color: #7289da; }
            .discord-btn:hover { background-color: #6778c4; }

            .copy-link-btn { background-color: #17a2b8; }
            .copy-link-btn:hover { background-color: #138496; }

            .save-preset-btn { background-color: #28a745; }
            .save-preset-btn:hover { background-color: #218838; }

            .save-btn3 {
                background: #0056b3;
                border: 1px solid rgba(83, 193, 255, 0.45);
                color: #053252;
                padding: 10px 24px;
                text-align: center;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                border-radius: 999px;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
            }

            .save-btn3:hover {
                transform: translateY(-1px);
                box-shadow: 0 12px 24px rgba(55, 184, 255, 0.35);
                background: linear-gradient(135deg, #ffffff 0%, #d5f3ff 100%);
                color: #053252;

            }

            .save-btn3:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                box-shadow: none;
            }

            /* Global Save Button */
            #my-servers-form .table thead, #my-servers-form > .save-btn3 { display: none; }
            #my-servers-form .mode-presets { display: none !important; }
            #my-servers-tab .myservers-inline-actions__cell { display: none !important; }

            /* Preset Controls */
            .preset-container { display: inline-flex; align-items: center; margin-right: 5px; }
            .delete-preset-btn { background: #dc3545; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; margin-left: -8px; z-index: 1; font-size: 14px; line-height: 20px; text-align: center; padding: 0; }
            .delete-preset-btn:hover { background: #c82333; }
            .control-group label { border-top-right-radius: 0; border-bottom-right-radius: 0; }

            /* Flag Selector */
            .flag-selector { display: flex; align-items: center; gap: 8px; padding-left: 100px; }
            .flag-icon { font-size: 1.5em; cursor: pointer; opacity: 0.6; transition: opacity 0.2s, transform 0.2s; }
            .flag-icon:hover { opacity: 1; transform: scale(1.1); }
            .flag-icon.selected { opacity: 1; transform: scale(1.1); border-bottom: 2px solid #00aaff; }

            /* Discord Modal */
            #sbd-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10001; visibility: hidden; opacity: 0; transition: visibility 0s, opacity 0.3s; }
            #sbd-modal.visible { visibility: visible; opacity: 1; }
            #sbd-modal > div { background: #2c2f33; padding: 25px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); width: 450px; max-width: 90%; color: #ddd; }
            #sbd-modal h3 { margin-top: 0; color: #7289da; text-align: center; }
            #sbd-webhook-input { width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #4f545c; border-radius: 4px; background: #40444b; color: #ddd; box-sizing: border-box; }
            #sbd-modal .sbd-buttons { display: flex; justify-content: flex-end; gap: 10px; }
            #sbd-modal .sbd-buttons button { padding: 10px 20px; border: none; border-radius: 4px; color: white; cursor: pointer; flex-grow: 1; }
            #sbd-clear-btn { background: #e74c3c; } #sbd-clear-btn:hover { background: #c0392b; }
            #sbd-cancel-btn { background: #747f8d; } #sbd-cancel-btn:hover { background: #5f6a7b; }
            #sbd-save-btn { background: #7289da; } #sbd-save-btn:hover { background: #6778c4; }

            /* Toast Notifications */
            #toast-container { position: fixed; top: 20px; right: 20px; z-index: 10002; display: flex; flex-direction: column; gap: 10px; }
            .toast { background-color: #333; color: #eee; padding: 15px 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); opacity: 0; transition: opacity 0.3s, transform 0.3s; transform: translateX(100%); border-left: 5px solid #555; }
            .toast.show { opacity: 1; transform: translateX(0); }
            .toast.success { background-color: #28a745; border-left-color: #218838; color: white; }
            .toast.error { background-color: #dc3545; border-left-color: #c82333; color: white; }
            .toast.info { background-color: #17a2b8; border-left-color: #138496; color: white; }
        `
    };

    const DEFAULT_PRESETS = {
        public: {
            isDefault: true,
            checkboxes: { enabled: true, public: true, mp_clanwar: true, amx_giveammo: true, mp_friendlyfire: false, mp_autoteambalance: true, mp_afkbomb: true, mp_restarter: true, afk_kick: true, perks: true, statistics: true, chickens: true, rnd_death: true, votekick: true, bonus_slot: true, tfb: true, statsx: true, dib3: true, rwd_grenadedrop: true, },
            cvars: { mp_rs_rounds: '200', pb_maxbots: '6', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '1.75', mp_buytime: '0.25', mp_c4timer: '35', mp_freezetime: '0', mp_startmoney: '16000', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', }
        },
        '5vs5': {
            isDefault: true,
            checkboxes: { enabled: true, public: false, mp_clanwar: true, nobombscore_enabled: true, bonus_slot: true, mp_friendlyfire: true, rwd_grenadedrop: true, },
            cvars: { mp_rs_rounds: '25', pb_maxbots: '0', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '1.75', mp_buytime: '0.25', mp_c4timer: '35', mp_freezetime: '15', mp_startmoney: '800', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', }
        },
        deathmatch: {
            isDefault: true,
            checkboxes: { enabled: true, public: true, mp_friendlyfire: true, mp_autoteambalance: true, mp_afkbomb: true, afk_kick: true, statistics: true, votekick: true, bonus_slot: true, tfb: true, statsx: true, dib3: false, rwd_grenadedrop: true, },
            cvars: { mp_rs_rounds: '200', pb_maxbots: '6', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '2.5', mp_buytime: '0.5', mp_c4timer: '35', mp_freezetime: '0', mp_startmoney: '1000', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', }
        }
    };

    let PRESET_DATA = {};

    // --- 2. CORE MODULES ---

    /** DOM Helper Functions */
    const getElementById = (id) => document.getElementById(id);
    const createAndAppendElement = (tagName, parent, attributes = {}, innerHTML = '') => {
        const element = document.createElement(tagName);
        for (const key in attributes) {
            if (key === 'classList') element.classList.add(...attributes[key]);
            else if (key === 'dataset') Object.assign(element.dataset, attributes[key]);
            else element.setAttribute(key, attributes[key]);
        }
        if (innerHTML) element.innerHTML = innerHTML;
        parent.appendChild(element);
        return element;
    };

    /** Toast Notification System */
    let toastContainer = null;
    function showToast(message, type = 'info', duration = 4000) {
        if (!toastContainer) {
            toastContainer = createAndAppendElement('div', document.body, { id: 'toast-container' });
        }
        const toast = createAndAppendElement('div', toastContainer, { classList: ['toast', type] }, message);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

    // --- 3. UI COMPONENTS ---

    /** Update Server Card Header */
    const updateServerCardHeader = (cardHeader, data) => {
        const { serverName, serverId, playersText, paidUntilDate, isEnabled, isVisible, mapName } = data;
        cardHeader.innerHTML = `
            <h4>${serverName} ${serverId}</h4>
            <div class="server-card-summary">
                <span><i class="fa fa-map-marker"></i> ${mapName}</span>
                <span><i class="fa fa-users"></i> ${playersText}</span>
                <span><i class="fa fa-calendar"></i> ${paidUntilDate}</span>
                <span><i class="fa fa-power-off" style="color: ${isEnabled ? '#4CAF50' : '#dc3545'};"></i> ${isEnabled ? 'Enabled' : 'Disabled'}</span>
                <span><i class="fa fa-eye" style="color: ${isVisible ? '#00aaff' : '#888'};"></i> ${isVisible ? 'Visible' : 'Hidden'}</span>
            </div>
            <span class="toggle-icon">&#x25B6;</span>`;
    };

    /** Create Flag-based Country Selector */
    function createFlagSelector(originalSelect) {
        const container = createAndAppendElement('div', originalSelect.parentNode, { classList: ['flag-selector'] });
        originalSelect.parentNode.insertBefore(container, originalSelect);
        originalSelect.style.display = 'none';

        const flags = Array.from(originalSelect.options).map(opt => {
            const countryCode = opt.value === 'ny' ? 'us' : opt.value;
            const flag = createAndAppendElement('span', container, {
                classList: ['flag-icon', `flag-icon-${countryCode}`],
                dataset: { value: opt.value },
                title: opt.textContent
            });

            flag.addEventListener('click', () => {
                originalSelect.value = flag.dataset.value;
                originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
                container.querySelectorAll('.flag-icon').forEach(f => f.classList.remove('selected'));
                flag.classList.add('selected');
            });

            return flag;
        });

        const setSelectedFlag = () => {
            flags.forEach(f => f.classList.toggle('selected', f.dataset.value === originalSelect.value));
        };

        setSelectedFlag();
        new MutationObserver(setSelectedFlag).observe(originalSelect, { attributes: true });
    }


    /** Discord Webhook Modal */
    let discordWebhookModal;
    function createDiscordWebhookModal() {
        if (getElementById('sbd-modal')) return;
        discordWebhookModal = createAndAppendElement('div', document.body, { id: 'sbd-modal' }, `
            <div>
                <h3>Discord Webhook Settings</h3>
                <p>Enter your Discord webhook URL to use the 'Share to Discord' feature.</p>
                <input type="url" id="sbd-webhook-input" placeholder="https://discord.com/api/webhooks/...">
                <div class="sbd-buttons">
                    <button id="sbd-clear-btn">Clear</button>
                    <button id="sbd-cancel-btn">Cancel</button>
                    <button id="sbd-save-btn">Save</button>
                </div>
            </div>`);

        const webhookInput = getElementById('sbd-webhook-input');
        webhookInput.value = GM_getValue('discordWebhookURL', '');

        getElementById('sbd-clear-btn').addEventListener('click', () => {
            webhookInput.value = '';
            GM_deleteValue('discordWebhookURL');
            hideDiscordWebhookModal();
        });
        getElementById('sbd-cancel-btn').addEventListener('click', hideDiscordWebhookModal);
        getElementById('sbd-save-btn').addEventListener('click', () => {
            const url = webhookInput.value.trim();
            if (url && url.startsWith('https://discord.com/api/webhooks/')) {
                GM_setValue('discordWebhookURL', url);
                showToast('Webhook URL saved!', 'success');
                hideDiscordWebhookModal();
            } else if (url) {
                showToast('Invalid webhook URL.', 'error');
            } else {
                GM_deleteValue('discordWebhookURL');
                hideDiscordWebhookModal();
            }
        });
        discordWebhookModal.addEventListener('click', e => {
            if (e.target === discordWebhookModal) hideDiscordWebhookModal();
        });
    }
    function showDiscordWebhookModal() {
        if (!discordWebhookModal) createDiscordWebhookModal();
        discordWebhookModal.classList.add('visible');
        getElementById('sbd-webhook-input').focus();
    }
    function hideDiscordWebhookModal() {
        if (discordWebhookModal) discordWebhookModal.classList.remove('visible');
    }

    /** Create Map Picker */
    function createMapPicker(parent, serverId) {
        const detailsDiv = parent.closest('.server-card-details');
        const mapContainer = createAndAppendElement('div', parent, { classList: ['control-map'] });
        mapContainer.innerHTML = '<span>MAP:</span>';
        const picker = createAndAppendElement('div', mapContainer, { classList: ['map-picker'] });

        const maps = [
            { name: 'de_dust2' },
            { name: 'de_inferno' },
            { name: 'de_mirage' },
            { name: 'de_nuke' },
            { name: 'de_tuscan' },
            { name: 'de_train' },
            { name: 'de_cache_v2' }
        ];

        // Don't rely on the select existing at call time; the original row may be moved later.
        let mapSelect = detailsDiv.querySelector(`select[name="server[${serverId}][map]"]`) || document.querySelector(`select[name="server[${serverId}][map]"]`);

        const getMapSelect = () => {
            if (!mapSelect || !document.contains(mapSelect)) {
                mapSelect = detailsDiv.querySelector(`select[name="server[${serverId}][map]"]`) || document.querySelector(`select[name="server[${serverId}][map]"]`);
            }
            return mapSelect;
        };

    maps.forEach(map => {
            // Use Placehold.co as the primary thumbnail, but keep original filename for fallback
            const displayText = map.name.replace(/_/g, ' '); // This will now be "dust2", "inferno", etc.
            const img = createAndAppendElement('img', picker, {
                src: `https://placehold.co/100x40/2a2a2a/ffffff?font=roboto&text=${encodeURIComponent(displayText)}`,
                title: map.name,
                dataset: { map: map.name },
                alt: map.name,
                width: '100',
                height: '40',
                loading: 'lazy'
            });

            // No fallback to repository images — use placeholders only

            img.addEventListener('click', () => {
                // Use the shared setter so thumbnails and select stay in sync
                setMapSelection(map.name);
            });
        });

        // Helper: select a map by name/value and update UI
        const setMapSelection = (mapName) => {
            if (!mapName) return;
            // Try to match an option in the select by text or value
            const ms = getMapSelect();
            if (ms) {
                const option = Array.from(ms.options).find(opt => {
                    const txt = (opt.textContent || '').trim().toLowerCase();
                    const val = (opt.value || '').trim().toLowerCase();
                    return txt === mapName.toLowerCase() || txt.includes(mapName.toLowerCase()) || val === mapName.toLowerCase() || val.includes(mapName.toLowerCase());
                });
                if (option) {
                    // Prefer setting the option.selected flag so selects without meaningful values still update
                    try {
                        option.selected = true;
                        ms.value = mapName; // Modified line to use cleaned map name
                    } catch (e) {
                        // Fallback to setting value
                        ms.value = mapName; // Modified line to use cleaned map name
                    }
                    // Dispatch both change and input to ensure enhanced/select replacement libraries pick it up
                    ms.dispatchEvent(new Event('input', { bubbles: true }));
                    ms.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            // Update thumbnail selection visually
            picker.querySelectorAll('img').forEach(i => {
                const imgMap = (i.dataset.map || '').toLowerCase();
                i.classList.toggle('selected', imgMap === mapName.toLowerCase());
            });
        };

        const updateSelectedMap = () => {
            const ms = getMapSelect();
            if (!ms) return; // defensive
            const selectedMapName = ms.options[ms.selectedIndex]?.textContent || '';
            picker.querySelectorAll('img').forEach(img => {
                img.classList.toggle('selected', selectedMapName.toLowerCase().includes((img.dataset.map || '').toLowerCase()));
            });
        };

        // Wire up any inline map-search UI found in the original table cell
        const mapSearchWrapper = detailsDiv.querySelector('.map-search-wrapper');
        if (mapSearchWrapper) {
            const searchInput = mapSearchWrapper.querySelector('.map-search-input');
            const searchOptions = Array.from(mapSearchWrapper.querySelectorAll('.map-search-option'));

            // Clicking an option sets the select and updates thumbnails
            searchOptions.forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = (btn.dataset.value || btn.textContent || '').trim();
                    if (value) setMapSelection(value);
                });
            });

            // Filter the option buttons as the user types
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const q = (searchInput.value || '').trim().toLowerCase();
                    searchOptions.forEach(b => {
                        const v = (b.dataset.value || b.textContent || '').toLowerCase();
                        b.style.display = (!q || v.includes(q)) ? '' : 'none';
                    });
                });
            }
        }

        // If the select exists now, wire it, otherwise observe the detailsDiv for the select being added
        const wireSelect = (ms) => {
            if (!ms) return;
            updateSelectedMap();
            ms.addEventListener('change', updateSelectedMap);
            new MutationObserver(updateSelectedMap).observe(ms, { childList: true, subtree: false });
        };

        wireSelect(getMapSelect());

        // Watch the detailsDiv and document for the select being inserted/moved later
        const observer = new MutationObserver(() => {
            const ms = getMapSelect();
            if (ms) wireSelect(ms);
        });
        observer.observe(detailsDiv, { childList: true, subtree: true });
    }

    // --- 4. FEATURE MODULES ---

    /** Update the preset controls in the UI */
    function updatePresetControls(controlGroup, serverId, detailsDiv) {
        controlGroup.innerHTML = '<span>MODE:</span>'; // Clear existing buttons
        Object.keys(PRESET_DATA).forEach(presetName => {
            const preset = PRESET_DATA[presetName];
            const presetContainer = createAndAppendElement('span', controlGroup, { classList: ['preset-container'] });
            const input = createAndAppendElement('input', presetContainer, { type: 'radio', id: `mode${presetName}_${serverId}`, name: `gameMode_${serverId}`, value: presetName });
            const label = createAndAppendElement('label', presetContainer, { for: `mode${presetName}_${serverId}` }, presetName);

            if (!preset.isDefault) {
                const deleteBtn = createAndAppendElement('button', presetContainer, {
                    type: 'button',
                    classList: ['delete-preset-btn'],
                    dataset: { presetName: presetName },
                    innerHTML: '&times;'
                });
            }
        });
    }

    /** Make Sections Collapsible */
    function makeCollapsible(headerElement, contentElement) {
        if (!headerElement || !contentElement) return;
        headerElement.style.cursor = 'pointer';
        headerElement.style.userSelect = 'none';
        contentElement.style.display = 'none';
        headerElement.innerHTML += ' <span class="toggle-icon">&#x25B6;</span>'; // Right-pointing triangle

        headerElement.addEventListener('click', () => {
            const isHidden = contentElement.style.display === 'none';
            contentElement.style.display = isHidden ? 'block' : 'none';
            const icon = headerElement.querySelector('.toggle-icon');
            if (icon) icon.innerHTML = isHidden ? '&#x25BC;' : '&#x25B6;';
        });
    }

    /** Load presets from storage or use defaults */
    function loadPresets() {
        const storedPresets = GM_getValue('serverManagerPresets', null);
        if (storedPresets) {
            PRESET_DATA = storedPresets;
        } else {
            PRESET_DATA = JSON.parse(JSON.stringify(DEFAULT_PRESETS)); // Deep copy
            GM_setValue('serverManagerPresets', PRESET_DATA);
        }
    }

    /** Apply Server Configuration Preset */
    /** Delete a custom preset */
    function deletePreset(presetName) {
        if (!PRESET_DATA[presetName] || PRESET_DATA[presetName].isDefault) {
            showToast('Cannot delete a default preset.', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
            delete PRESET_DATA[presetName];
            GM_setValue('serverManagerPresets', PRESET_DATA);
            showToast(`Preset "${presetName}" deleted.`, 'success');

            // Refresh all preset controls on the page
            document.querySelectorAll('.server-card').forEach(card => {
                const id = card.dataset.serverId;
                const controls = card.querySelector('.server-controls .control-group');
                const details = card.querySelector('.server-card-details');
                if (id && controls && details) {
                    updatePresetControls(controls, id, details);
                }
            });
        }
    }

    /** Save the current server settings as a new preset */
    function savePreset(serverId, detailsDiv) {
        const presetName = prompt('Enter a name for this preset:', '');
        if (!presetName || !presetName.trim()) {
            showToast('Preset name cannot be empty.', 'error');
            return;
        }
        if (PRESET_DATA[presetName]) {
            if (!confirm(`A preset named "${presetName}" already exists. Overwrite it?`)) {
                return;
            }
        }

        const newPreset = {
            isDefault: false,
            checkboxes: {},
            cvars: {}
        };

        detailsDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            const match = cb.id.match(/server\[\d+\]\[(cvars)\]\[(.+)\]/) || cb.id.match(/server\[\d+\]\[(public|enabled)\]/);
            if (match) {
                const key = match[2] || match[1];
                newPreset.checkboxes[key] = cb.checked;
            }
        });

        detailsDiv.querySelectorAll('select').forEach(select => {
            const match = select.name.match(/server\[\d+\]\[(cvars)\]\[(.+)\]/);
            if (match) {
                const key = match[2];
                newPreset.cvars[key] = select.value;
            }
        });

        PRESET_DATA[presetName] = newPreset;
        GM_setValue('serverManagerPresets', PRESET_DATA);
        showToast(`Preset "${presetName}" saved!`, 'success');

        // Refresh the preset buttons
        const serverControls = detailsDiv.querySelector('.server-controls');
        const controlGroup = serverControls.querySelector('.control-group');
        const serverCard = detailsDiv.closest('.server-card');
        const currentServerId = serverCard.dataset.serverId;
        updatePresetControls(controlGroup, currentServerId, detailsDiv);
    }

    /** Apply Server Configuration Preset */
    function applyPreset(presetName, serverId, detailsDiv) {
        const preset = PRESET_DATA[presetName];
        if (!preset) return;

        // Reset relevant checkboxes before applying
        detailsDiv.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (cb.id.includes(`[cvars]`) || cb.id.includes(`[public]`) || cb.id.includes(`[enabled]`)) {
                cb.checked = false;
            }
        });

        // Apply preset values
        Object.entries(preset.checkboxes).forEach(([key, value]) => {
            const selector = key === 'public' ? CONFIG.SELECTORS.serverPublicCheckbox(serverId) :
                             key === 'enabled' ? CONFIG.SELECTORS.serverEnabledCheckbox(serverId) :
                             CONFIG.SELECTORS.cvarCheckbox(serverId, key);
            const checkbox = detailsDiv.querySelector(selector);
            if (checkbox) checkbox.checked = value;
        });
        Object.entries(preset.cvars).forEach(([key, value]) => {
            const select = detailsDiv.querySelector(CONFIG.SELECTORS.cvarSelect(serverId, key));
            if (select) select.value = value;
        });

        // Visually confirm the change
        const serverCard = detailsDiv.closest('.server-card');
        if (serverCard) {
            serverCard.style.outline = '2px solid orange';
            setTimeout(() => serverCard.style.outline = '', 1500);
            // Trigger header update
            detailsDiv.querySelector(CONFIG.SELECTORS.serverEnabledCheckbox(serverId))
                .dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /** Copy Server Link and PIN to Clipboard */
    async function copyServerLinkToClipboard(serverId, detailsDiv) {
        const serverLink = detailsDiv.querySelector(CONFIG.SELECTORS.serverLink(serverId))?.href || '';
        const pin = detailsDiv.querySelector(`input[name="pin_${serverId}"]`)?.value || '';

        if (!serverLink) {
            showToast('Could not find server link.', 'error');
            return;
        }

        const textToCopy = `${serverLink}\n\n\n${pin}`;

        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast('Server link and PIN copied!', 'success');
        } catch (err) {
            showToast('Failed to copy link.', 'error');
            console.error('Clipboard copy error:', err);
        }
    }

    /** Share Server Info to Discord */
    async function sendServerToDiscord(serverId, detailsDiv) {
        const webhookURL = GM_getValue('discordWebhookURL', '');
        if (!webhookURL) {
            showToast('Set your Discord webhook URL first (Alt+Shift+D).', 'info');
            showDiscordWebhookModal();
            return;
        }

        // Helper to wait for a global variable
        const waitForValue = (getValue, timeout = 2000, interval = 100) => {
            return new Promise((resolve) => {
                const check = () => {
                    const value = getValue();
                    if (value) {
                        resolve(value);
                    } else if (timeout > 0) {
                        timeout -= interval;
                        setTimeout(check, interval);
                    } else {
                        resolve(null); // Resolve with null if timeout is reached
                    }
                };
                check();
            });
        };

        const username = await waitForValue(() => unsafeWindow.cvars?.name) || 'a user';
        const serverName = detailsDiv.querySelector(CONFIG.SELECTORS.serverNameInput(serverId))?.value || `Server ${serverId}`;
        const mapName = detailsDiv.querySelector(`select[name="server[${serverId}][map]"] option:checked`)?.textContent || 'N/A';
        const pin = detailsDiv.querySelector(`input[name="pin_${serverId}"]`)?.value || 'None';
        const serverLink = detailsDiv.querySelector(CONFIG.SELECTORS.serverLink(serverId))?.href || 'No link';
        const randomColor = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];

        const payload = {
            username: 'Server Manager Bot',
            embeds: [{
                title: `🎮 ${serverName}`,
                color: randomColor,
                fields: [
                    { name: '🗺️ Map', value: mapName, inline: true },
                    { name: '🔒 PIN', value: pin, inline: true },
                    { name: '🔗 Join Link', value: serverLink, inline: false }
                ],
                footer: { text: `Shared by ${username}` },
                timestamp: new Date().toISOString()
            }]
        };

        try {
            const response = await fetch(webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                showToast(`Server "${serverName}" shared!`, 'success');
            } else {
                showToast('Discord webhook error. See console.', 'error');
                console.error('Discord Error:', await response.text());
            }
        } catch (error) {
            showToast('Network error sending to Discord.', 'error');
            console.error('Discord Fetch Error:', error);
        }
    }

    /** Fix Broken Server Links */
    const fixServerLink = (linkElement) => {
        if (!linkElement) return;
        let href = linkElement.getAttribute('href') || '';
        if (href.startsWith('://')) {
            linkElement.setAttribute('href', `https${href}`);
        }
    };

    /** Fetch and Display Server Owner Username */
    async function fetchAndDisplayOwnerUsername(ownerNoticeElement) {
        const match = (ownerNoticeElement.textContent || '').match(/Server owner id: #(\d+)/);
        if (!match) return;
        const ownerId = match[1];
        try {
            const response = await fetch(`https://play-cs.com/rating/search/${ownerId}`);
            if (!response.ok) return;
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const playerNameSpan = doc.querySelector('span.player_name');
            if (playerNameSpan) {
                const ownerDiv = createAndAppendElement('div', ownerNoticeElement, { classList: ['owner-username'] }, 'Owner: ');
                const profileLink = createAndAppendElement('a', ownerDiv, { href: `https://play-cs.com/rating/search/${ownerId}`, target: '_blank' });
                profileLink.appendChild(playerNameSpan.cloneNode(true));
            }
        } catch (error) {
            console.error(`Error fetching owner data for ID ${ownerId}:`, error);
        }
    }

    // --- 5. INITIALIZATION ---

    function initialize() {
        loadPresets();
        GM_addStyle(CONFIG.css);
        const myServersForm = getElementById(CONFIG.mainFormId);
        if (!myServersForm) return;

        // --- A. Setup Collapsible Page Sections ---
        const newServerHeader = document.querySelector('.myservers-card--new .myservers-card__header');
        const newServerContent = document.querySelector('.myservers-card--new .myservers-card__body');
        makeCollapsible(newServerHeader, newServerContent);

        const specsHeader = document.querySelector('.myservers-card--specs .myservers-card__header');
        const specsContent = document.querySelector('.myservers-card--specs .myservers-card__body');
        makeCollapsible(specsHeader, specsContent);

        // --- B. Transform Server Table to Cards ---
        const originalTable = myServersForm.querySelector(CONFIG.originalTableSelector);
        const tbody = originalTable?.querySelector('tbody');
        if (!originalTable || !tbody) return;

        const globalSaveButton = myServersForm.querySelector(`.${CONFIG.globalSaveButtonClass}`);

        const serverCardsContainer = createAndAppendElement('div', originalTable.parentNode, { id: CONFIG.cardContainerId });
        originalTable.parentNode.insertBefore(serverCardsContainer, originalTable);

        let currentServerDetailsTable = null;
        Array.from(tbody.children).forEach(row => {
            if (row.classList.contains(CONFIG.serverRowClass) && row.dataset.server) {
                const serverId = row.dataset.server;
                const serverCard = createAndAppendElement('div', serverCardsContainer, { classList: ['server-card'], dataset: { serverId } });
                const detailsDiv = createAndAppendElement('div', serverCard, { classList: ['server-card-details'] });

                // Create Header
                const serverName = row.querySelector(CONFIG.SELECTORS.serverNameInput(serverId))?.value || `Server ${serverId}`;
                const playersPaidText = row.children[3]?.textContent.trim() || '';
                const isEnabled = row.querySelector(CONFIG.SELECTORS.serverEnabledCheckbox(serverId))?.checked;
                const isVisible = row.querySelector(CONFIG.SELECTORS.serverPublicCheckbox(serverId))?.checked;
                const mapSelect = row.querySelector(`select[name="server[${serverId}][map]"]`);
                const mapName = mapSelect ? mapSelect.options[mapSelect.selectedIndex]?.text : 'N/A';

                const cardHeader = createAndAppendElement('div', serverCard, { classList: ['server-card-header'] });
                serverCard.insertBefore(cardHeader, detailsDiv);
                updateServerCardHeader(cardHeader, {
                    serverName, serverId,
                    playersText: playersPaidText.split('(')[0].trim(),
                    paidUntilDate: playersPaidText.match(/\((.*?)\)/)?.[1] || 'N/A',
                    isEnabled, isVisible, mapName
                });

                // Create Controls
                const serverControls = createAndAppendElement('div', detailsDiv, { classList: ['server-controls'] });
                const topControls = createAndAppendElement('div', serverControls, { style: "display: flex; width: 100%; gap: 15px;" });
                const controlGroup = createAndAppendElement('div', topControls, { classList: ['control-group'] });
                updatePresetControls(controlGroup, serverId, detailsDiv);
                createMapPicker(topControls, serverId);

                const actionButtons = createAndAppendElement('div', serverControls, { classList: ['action-buttons'] });
                actionButtons.innerHTML = `
                    <button type="button" class="save-preset-btn" data-server-id="${serverId}"><i class="fa fa-save"></i> Save as Preset</button>
                    <button type="button" class="copy-link-btn" data-server-id="${serverId}"><i class="fa fa-clipboard"></i> Copy Link</button>
                    <button type="button" class="discord-btn" data-server-id="${serverId}"><i class="fa fa-discord"></i> Share to Discord</button>
                `;
                if (globalSaveButton) {
                    actionButtons.appendChild(globalSaveButton.cloneNode(true));
                }
                detailsDiv.insertBefore(serverControls, detailsDiv.firstChild);

                // Move row into details table
                currentServerDetailsTable = createAndAppendElement('table', detailsDiv, { classList: ['details-table'] });
                currentServerDetailsTable.appendChild(row);

                // Add Event Listeners
                cardHeader.addEventListener('click', () => {
                    const isHidden = detailsDiv.style.display === 'none';
                    detailsDiv.style.display = isHidden ? 'block' : 'none';
                    cardHeader.classList.toggle('expanded', isHidden);
                    cardHeader.querySelector('.toggle-icon').innerHTML = isHidden ? '&#x25BC;' : '&#x25B6;';
                });

                serverControls.addEventListener('change', e => {
                    if (e.target.name === `gameMode_${serverId}`) applyPreset(e.target.value, serverId, detailsDiv);
                });

                serverControls.addEventListener('click', e => {
                    if (e.target.classList.contains('delete-preset-btn')) {
                        const presetName = e.target.dataset.presetName;
                        deletePreset(presetName);
                    }
                });

                serverControls.querySelector('.discord-btn').addEventListener('click', () => sendServerToDiscord(serverId, detailsDiv));
                serverControls.querySelector('.copy-link-btn').addEventListener('click', () => copyServerLinkToClipboard(serverId, detailsDiv));
                serverControls.querySelector('.save-preset-btn').addEventListener('click', () => savePreset(serverId, detailsDiv));

                const updateHeaderCallback = () => {
                    const latestIsEnabled = detailsDiv.querySelector(CONFIG.SELECTORS.serverEnabledCheckbox(serverId))?.checked;
                    const latestIsVisible = detailsDiv.querySelector(CONFIG.SELECTORS.serverPublicCheckbox(serverId))?.checked;
                    const currentServerName = detailsDiv.querySelector(CONFIG.SELECTORS.serverNameInput(serverId))?.value;
                    const currentMapSelect = detailsDiv.querySelector(`select[name="server[${serverId}][map]"]`);
                    const currentMapName = currentMapSelect ? currentMapSelect.options[currentMapSelect.selectedIndex]?.text : 'N/A';
                    updateServerCardHeader(cardHeader, {
                        serverName: currentServerName, serverId,
                        playersText: playersPaidText.split('(')[0].trim(),
                        paidUntilDate: playersPaidText.match(/\((.*?)\)/)?.[1] || 'N/A',
                        isEnabled: latestIsEnabled, isVisible: latestIsVisible, mapName: currentMapName
                    });
                };
                detailsDiv.addEventListener('change', updateHeaderCallback);
                detailsDiv.addEventListener('input', e => {
                    if (e.target.matches(CONFIG.SELECTORS.serverNameInput(serverId))) updateHeaderCallback();
                });

                // Fix server link initially and on changes
                const serverLinkElement = row.querySelector(CONFIG.SELECTORS.serverLink(serverId));
                if (serverLinkElement) {
                    fixServerLink(serverLinkElement);
                    new MutationObserver(() => fixServerLink(serverLinkElement))
                        .observe(serverLinkElement, { attributes: true, childList: true, subtree: true, characterData: true });
                }

            } else if (currentServerDetailsTable) {
                // This is a detail row, append it to the current server's table
                currentServerDetailsTable.appendChild(row);
            }
        });

        originalTable.style.display = 'none';

        // --- C. Finalize UI Enhancements ---
    document.querySelectorAll('select[name$="[country]"]').forEach(createFlagSelector);
    // The following line is removed to disable the searchable dropdown:
    // document.querySelectorAll('select[name$="[map]"]').forEach(createSearchableDropdown);
        document.querySelectorAll('.admin_notice').forEach(fetchAndDisplayOwnerUsername);
        createDiscordWebhookModal(); // Pre-build the modal structure
        document.addEventListener('keydown', e => {
            if (e.altKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                if (discordWebhookModal?.classList.contains('visible')) {
                    hideDiscordWebhookModal();
                } else {
                    showDiscordWebhookModal();
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
