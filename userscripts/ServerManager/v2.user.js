// ==UserScript==
// @name         CS Server Manager
// @namespace    http://tampermonkey.net/
// @version      2
// @description  Transforms server table into collapsible cards with new per-server control functions at the top of details, with working mode presets, dynamic header updates, and basic save. Prevents page reload on save and fixes broken server links.
// @author       tiger3homs aka (obbe.00) on discord
// @match        https://play-cs.com/myservers
// @match        https://play-cs.com/*/myservers
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration and Constants ---
    const CONFIG = {
        mainFormId: 'my-servers-form',
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
            serverLink: (id) => `tr[data-server="${id}"] a[target="_blank"]`, // Selector for the server link
        },
        css: `
            .server-card { background-color: #2a2a2a; border: 1px solid #444; border-radius: 8px; margin-bottom: 15px; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); font-family: Arial, sans-serif; color: #ccc; overflow: hidden; }
            .server-card-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding-bottom: 10px; border-bottom: 1px solid #333; margin-bottom: 10px; transition: background-color 0.2s; }
            .server-card-header:hover { background-color: #333; border-radius: 5px; padding: 5px 10px; margin: -5px -10px 5px; }
            .server-card-header h4 { margin: 0; color: #eee; font-size: 1.2em; }
            .server-card-summary { display: flex; gap: 20px; font-size: 0.9em; color: #bbb; }
            .server-card-summary span { display: flex; align-items: center; gap: 5px; }
            .server-card-summary i { color: #888; }
            .toggle-icon { font-size: 1.2em; transition: transform 0.2s; }
            .server-card-header.expanded .toggle-icon { transform: rotate(90deg); }
            .server-card-details { display: none; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; overflow-x: auto; }
            .server-card-details .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 0; }
            .server-card-details .details-table th, .server-card-details .details-table td { border: 1px solid #444; padding: 8px; text-align: left; font-size: 0.9em; vertical-align: top; }
            .server-card-details .details-table th { background-color: #333; color: #eee; }
            .server-card-details .details-table td { background-color: #222; color: #ccc; }
            .server-card-details .myserver { background-color: #222; }
            .server-card-details :where(input[type="text"], select, .input_dark) { background-color: #333 !important; border: 1px solid #555 !important; color: #eee !important; padding: 5px; border-radius: 4px; width: calc(100% - 12px); box-sizing: border-box; }
            .server-card-details :is(.save-btn, .save-btn2, .admin_add_button) { background-color: #007bff; color: white !important; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 5px; margin-top: 5px; text-decoration: none !important; display: inline-block; font-size: 0.9em; transition: background-color 0.2s; }
            .server-card-details :is(.save-btn, .save-btn2):hover { background-color: #0056b3; }
            .server-card-details .admin_add_button { background-color: #4CAF50; }
            .server-card-details .admin_add_button:hover { background-color: #45a049; }
            .server-card-details .cvar-name { color: #aaddff; }
            .server-card-details .fa { color: #00aaff; }
            .server-card-details .owner-username { color: #eee; margin-top: 5px; }
            .server-card-details .owner-username span { color: #ffd700; } /* Make all spans inside visible */
            .server-card-details .premium-color, .server-card-details .gold-color { color: #ffd700; }
            #my-servers-form .table thead, #my-servers-form > .save-btn3 { display: none; }
            .global-save-button-container { margin-top: 30px; text-align: center; padding: 15px; border-top: 1px solid #444; background-color: #2a2a2a; border-radius: 8px; }
            .global-save-button-container .save-btn3 { background-color: #dc3545; color: white !important; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1.1em; text-decoration: none !important; display: inline-block; transition: background-color 0.2s; }
            .global-save-button-container .save-btn3:hover { background-color: #c82333; }
            .server-controls { background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px; margin-top: 0; margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 15px; align-items: center; color: #eee; }
            .server-controls .control-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
            .server-controls .control-group label { cursor: pointer; background-color: #333; border: 1px solid #555; border-radius: 5px; padding: 7px 10px; transition: background-color 0.2s, border-color 0.2s; color: #ccc; font-weight: normal; font-size: 0.9em; }
            .server-controls .control-group input[type="checkbox"], .server-controls .control-group input[type="radio"] { display: none; }
            .server-controls .control-group input[type="checkbox"]:checked + label, .server-controls .control-group input[type="radio"]:checked + label { background-color: #007bff; border-color: #007bff; color: white; font-weight: bold; }
            .server-controls .action-buttons { margin-left: auto; display: flex; gap: 10px; flex-wrap: wrap; }
            .server-controls .action-buttons button { background-color: #007bff; color: white; padding: 9px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.95em; transition: background-color 0.2s; }
            .server-controls .action-buttons button:hover { background-color: #0056b3; }
            .server-controls .action-buttons .discord-btn { background-color: #7289da; }
            .server-controls .action-buttons .discord-btn:hover { background-color: #6778c4; }

            /* Styles for the Discord Webhook Modal */
            #sbd-modal {
                position: fixed; top: 0px; left: 0px; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex; justify-content: center; align-items: center;
                z-index: 10001; font-family: Arial, sans-serif;
                visibility: hidden; /* Hidden by default */
                opacity: 0; /* Fade effect */
                transition: visibility 0s, opacity 0.3s linear;
            }
            #sbd-modal.visible {
                visibility: visible;
                opacity: 1;
            }
            #sbd-modal > div {
                background: rgb(44, 47, 51); padding: 25px; border-radius: 8px;
                box-shadow: rgba(0, 0, 0, 0.3) 0px 4px 15px; width: 450px;
                max-width: 90%; color: rgb(220, 221, 222);
            }
            #sbd-modal h3 {
                margin-top:0;color:#7289da;text-align:center;
            }
            #sbd-modal p {
                font-size:13px;margin-bottom:15px;color:#ccc;
            }
            #sbd-webhook-input {
                width:calc(100% - 20px);padding:10px;margin-bottom:20px;
                border:1px solid #4f545c;border-radius:4px;background:#40444b;
                color:#dcddde;font-size:14px;box-sizing:border-box;
            }
            #sbd-modal .sbd-buttons {
                display:flex;justify-content:flex-end;gap:10px;
            }
            #sbd-modal .sbd-buttons button {
                padding:10px 20px;border:none;border-radius:4px;color:white;
                cursor:pointer;font-size:14px;transition:background .2s;flex-grow:1;
            }
            #sbd-clear-btn { background:#e74c3c; }
            #sbd-clear-btn:hover { background:#c0392b; }
            #sbd-cancel-btn { background:#747f8d; }
            #sbd-cancel-btn:hover { background:#5f6a7b; }
            #sbd-save-btn { background:#7289da; }
            #sbd-save-btn:hover { background:#6778c4; }

            /* Searchable Dropdown */
            .searchable-select-container {
                position: relative;
                width: 100%;
            }
            .searchable-select-input {
                width: 100%;
                padding: 5px;
                box-sizing: border-box;
                background-color: #333 !important;
                border: 1px solid #555 !important;
                color: #eee !important;
                border-radius: 4px;
            }
            .searchable-select-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background-color: #2a2a2a;
                border: 1px solid #444;
                border-radius: 4px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                display: none; /* Hidden by default */
            }
            .searchable-select-dropdown .option {
                padding: 8px;
                cursor: pointer;
                color: #ccc;
            }
            .searchable-select-dropdown .option:hover {
                background-color: #333;
            }
            .searchable-select-dropdown .option.hidden {
                display: none;
            }

            /* Toast Notifications */
            #toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10002;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .toast {
                background-color: #333;
                color: #eee;
                padding: 15px 20px;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                opacity: 0;
                transition: opacity 0.3s, transform 0.3s;
                transform: translateX(100%);
                font-family: Arial, sans-serif;
                font-size: 1em;
                border-left: 5px solid #555;
            }
            .toast.show {
                opacity: 1;
                transform: translateX(0);
            }
            .toast.success {
                background-color: #28a745;
                border-left-color: #218838;
                color: white;
            }
            .toast.error {
                background-color: #dc3545;
                border-left-color: #c82333;
                color: white;
            }
            .toast.info {
                background-color: #17a2b8;
                border-left-color: #138496;
                color: white;
            }
        `
    };

    // --- Preset Definitions (Data-Driven) ---
    const PRESET_DATA = {
        public: {
            checkboxes: { enabled: true, public: true, mp_clanwar: true, amx_giveammo: true, mp_friendlyfire: false, mp_autoteambalance: true, mp_afkbomb: true, mp_restarter: true, afk_kick: true, perks: true, statistics: true, chickens: true, rnd_death: true, votekick: true, bonus_slot: true, tfb: true, statsx: true, dib3: true, rwd_grenadedrop: true, },
            cvars: { mp_rs_rounds: '200', pb_maxbots: '6', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '1.75', mp_buytime: '0.25', mp_c4timer: '35', mp_freezetime: '0', mp_startmoney: '16000', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', }
        },
        '5vs5': {
            checkboxes: { enabled: true, public: false, mp_clanwar: true, nobombscore_enabled: true, bonus_slot: true, mp_friendlyfire: true, rwd_grenadedrop: true, },
            cvars: { mp_rs_rounds: '25', pb_maxbots: '0', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '1.75', mp_buytime: '0.25', mp_c4timer: '35', mp_freezetime: '15', mp_startmoney: '800', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', }
        },
        deathmatch: {
            checkboxes: { enabled: true, public: true, mp_friendlyfire: true, mp_autoteambalance: true, mp_afkbomb: true, afk_kick: true, statistics: true, votekick: true, bonus_slot: true, tfb: true, statsx: true, dib3: false, rwd_grenadedrop: true, },
            cvars: { mp_rs_rounds: '200', pb_maxbots: '6', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '2.5', mp_buytime: '0.5', mp_c4timer: '35', mp_freezetime: '0', mp_startmoney: '1000', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', }
        }
    };

    // --- Helper Functions ---
    // --- Toast Notification System ---
    let toastContainer = null;
    function showToast(message, type = 'info', duration = 4000) {
        if (!toastContainer) {
            toastContainer = createAndAppendElement('div', document.body, { id: 'toast-container' });
        }

        const toast = createAndAppendElement('div', toastContainer, { classList: ['toast', type] }, message);

        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10); // Small delay for CSS transition

        // Hide and remove the toast
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, duration);
    }

    const getElementById = (id) => document.getElementById(id);
    const createAndAppendElement = (tagName, parent, attributes = {}, innerHTML = '') => {
        const element = document.createElement(tagName);
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                if (key === 'classList') element.classList.add(...attributes[key]);
                else if (key === 'dataset') for (const dataKey in attributes[key]) element.dataset[dataKey] = attributes[key][dataKey];
                else element.setAttribute(key, attributes[key]);
            }
        }
        if (innerHTML) element.innerHTML = innerHTML;
        parent.appendChild(element);
        return element;
    };

    const updateServerCardHeader = (cardHeader, data) => {
        const { serverName, serverId, playersText, paidUntilDate, isEnabled, isVisible, mapName } = data;
        cardHeader.innerHTML = `
            <h4>${serverName} ${serverId}</h4>
            <div class="server-card-summary">
                <span><i class="fa fa-map-marker" aria-hidden="true"></i> ${mapName}</span>
                <span><i class="fa fa-users" aria-hidden="true"></i> ${playersText}</span>
                <span><i class="fa fa-calendar" aria-hidden="true"></i> ${paidUntilDate}</span>
                <span><i class="fa fa-power-off" aria-hidden="true" style="color: ${isEnabled ? '#4CAF50' : '#dc3545'};"></i> ${isEnabled ? 'Enabled' : 'Disabled'}</span>
                <span><i class="fa fa-eye" aria-hidden="true" style="color: ${isVisible ? '#00aaff' : '#888'};"></i> ${isVisible ? 'Visible' : 'Hidden'}</span>
            </div>
            <span class="toggle-icon">&#x25B6;</span>
        `;
    };

    const toggleServerDetails = (detailsDiv, cardHeader) => {
        const isHidden = detailsDiv.style.display === 'none';
        detailsDiv.style.display = isHidden ? 'block' : 'none';
        cardHeader.classList.toggle('expanded', isHidden);
        const toggleIcon = cardHeader.querySelector('.toggle-icon');
        if (toggleIcon) toggleIcon.innerHTML = isHidden ? '&#x25BC;' : '&#x25B6;';
    };

    const highlightServerCard = (serverCard, color = 'orange') => {
        serverCard.style.outline = `2px solid ${color}`;
        setTimeout(() => serverCard.style.outline = '', 1500);
    };

    /**
     * Ensures a server link has the correct 'https://' protocol.
     * This function is designed to be called when the link's attributes or text content change.
     * @param {HTMLElement} linkElement The <a> tag of the server link.
     */
    const fixServerLink = (linkElement) => {
        if (!linkElement) return;

        let currentHref = linkElement.getAttribute('href') || '';
        let currentText = linkElement.textContent || '';

        // If href starts with "://", prepend "https"
        if (currentHref.startsWith('://')) {
            currentHref = `https${currentHref}`;
            linkElement.setAttribute('href', currentHref);
            console.log(`Fixed href for server link: ${currentHref}`);
        }

        // If text content starts with "://", prepend "https"
        if (currentText.startsWith('://')) {
            currentText = `https${currentText}`;
            linkElement.textContent = currentText;
            console.log(`Fixed textContent for server link: ${currentText}`);
        }
    };

    function createSearchableDropdown(originalSelect) {
        const container = document.createElement('div');
        container.className = 'searchable-select-container';
        originalSelect.parentNode.insertBefore(container, originalSelect);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'searchable-select-input';
        input.placeholder = 'Search maps...';
        container.appendChild(input);

        const dropdown = document.createElement('div');
        dropdown.className = 'searchable-select-dropdown';
        container.appendChild(dropdown);

        const options = Array.from(originalSelect.options).map(optionEl => {
            const option = document.createElement('div');
            option.className = 'option';
            option.textContent = optionEl.textContent;
            option.dataset.value = optionEl.value;
            dropdown.appendChild(option);
            return option;
        });

        // Set initial input value
        if (originalSelect.value) {
            const selectedOption = originalSelect.querySelector(`option[value="${originalSelect.value}"]`);
            if (selectedOption) {
                input.value = selectedOption.textContent;
            }
        }


        originalSelect.style.display = 'none'; // Hide original select

        // Show/Hide dropdown
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other dropdowns
            document.querySelectorAll('.searchable-select-dropdown').forEach(d => {
                if (d !== dropdown) d.style.display = 'none';
            });
            dropdown.style.display = 'block';
        });

        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });

        // Filter options
        input.addEventListener('input', () => {
            const filter = input.value.toLowerCase();
            options.forEach(option => {
                const text = option.textContent.toLowerCase();
                option.classList.toggle('hidden', !text.includes(filter));
            });
        });

        // Select option
        options.forEach(option => {
            option.addEventListener('click', () => {
                input.value = option.textContent;
                originalSelect.value = option.dataset.value;
                // Trigger change event for any other scripts listening
                originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
                dropdown.style.display = 'none';
            });
        });
    }


    function applyPreset(presetName, serverId, detailsDiv) {
        const preset = PRESET_DATA[presetName];
        if (!preset) { console.error(`Preset "${presetName}" not found for Server ID: ${serverId}`); return; }

        detailsDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id.startsWith(`server[${serverId}][cvars]`) || checkbox.id === `server[${serverId}][public]` || checkbox.id === `server[${serverId}][enabled]`) {
                checkbox.checked = false;
            }
        });

        for (const cvarKey in preset.checkboxes) {
            let checkbox;
            if (cvarKey === 'public') checkbox = detailsDiv.querySelector(CONFIG.SELECTORS.serverPublicCheckbox(serverId));
            else if (cvarKey === 'enabled') checkbox = detailsDiv.querySelector(CONFIG.SELECTORS.serverEnabledCheckbox(serverId));
            else checkbox = detailsDiv.querySelector(CONFIG.SELECTORS.cvarCheckbox(serverId, cvarKey));

            if (checkbox) {
                checkbox.checked = preset.checkboxes[cvarKey];
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            } else { console.warn(`Preset "${presetName}" for Server ID ${serverId}: Checkbox "${cvarKey}" not found.`); }
        }

        for (const cvarKey in preset.cvars) {
            const selectElement = detailsDiv.querySelector(CONFIG.SELECTORS.cvarSelect(serverId, cvarKey));
            if (selectElement) {
                selectElement.value = preset.cvars[cvarKey];
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
            } else { console.warn(`Preset "${presetName}" for Server ID ${serverId}: Select "${cvarKey}" not found.`); }
        }
        const serverCard = detailsDiv.closest('.server-card');
        if (serverCard) {
            highlightServerCard(serverCard);
            const isEnabled = detailsDiv.querySelector(CONFIG.SELECTORS.serverEnabledCheckbox(serverId))?.checked || false;
            const isVisible = detailsDiv.querySelector(CONFIG.SELECTORS.serverPublicCheckbox(serverId))?.checked || false;
            const cardHeader = serverCard.querySelector('.server-card-header');
            if (cardHeader) {
                const serverName = detailsDiv.querySelector(CONFIG.SELECTORS.serverNameInput(serverId))?.value || `Server ${serverId}`;
                const playersText = cardHeader.querySelector('.server-card-summary span:nth-child(2)')?.textContent.replace(/^\s*\S+\s*/, '').trim() || 'N/A';
                const paidUntilDate = cardHeader.querySelector('.server-card-summary span:nth-child(3)')?.textContent.replace(/^\s*\S+\s*/, '').trim() || 'N/A';
                const mapSelect = detailsDiv.querySelector(`select[name="server[${serverId}][map]"]`);
                const mapName = mapSelect ? mapSelect.options[mapSelect.selectedIndex]?.text : 'N/A';


                // Use the latest isEnabled and isVisible determined after applying the preset
                const latestIsEnabled = detailsDiv.querySelector(CONFIG.SELECTORS.serverEnabledCheckbox(serverId))?.checked || false;
                const latestIsVisible = detailsDiv.querySelector(CONFIG.SELECTORS.serverPublicCheckbox(serverId))?.checked || false;
                updateServerCardHeader(cardHeader, { serverName, serverId, playersText, paidUntilDate, isEnabled: latestIsEnabled, isVisible: latestIsVisible, mapName });
            }
        }
    }

    function createServerControls(serverId, serverCardElement, detailsDiv) {
        const serverControls = createAndAppendElement('div', detailsDiv, { classList: ['server-controls'] }, `
            <div class="control-group">
                <span>MODE:</span>
                <input type="radio" id="modePublic_${serverId}" name="gameMode_${serverId}" value="public"><label for="modePublic_${serverId}">Public</label>
                <input type="radio" id="mode5vs5_${serverId}" name="gameMode_${serverId}" value="5vs5"><label for="mode5vs5_${serverId}">5vs5</label>
                <input type="radio" id="modeDeathmatch_${serverId}" name="gameMode_${serverId}" value="deathmatch"><label for="modeDeathmatch_${serverId}">Deathmatch</label>
            </div>
            <div class="action-buttons">
                <button type="button" id="shareToDiscord_${serverId}" class="discord-btn"><i class="fa fa-discord" aria-hidden="true"></i> Share to Discord</button>
            </div>
        `);

        serverControls.addEventListener('change', (event) => {
            if (event.target.name === `gameMode_${serverId}` && event.target.type === 'radio' && event.target.checked) {
                applyPreset(event.target.value, serverId, detailsDiv);
            }
        });

        // --- Discord Webhook Sending Function ---
        async function sendServerToDiscord(serverId, detailsDiv) {
            const webhookURL = GM_getValue('discordWebhookURL', '');
            if (!webhookURL) {
                showToast('Set your Discord webhook URL first (Alt+Shift+D).', 'info');
                showDiscordWebhookModal();
                return;
            }

            // Gather info
            const serverName = detailsDiv.querySelector(CONFIG.SELECTORS.serverNameInput(serverId))?.value || `Server ${serverId}`;
            const mapInput = detailsDiv.querySelector('select[name="server[' + serverId + '][map]"]')?.value || 'Unknown Map';
            const pinInput = detailsDiv.querySelector('input[name="pin_' + serverId + '"]')?.value || 'N/A';
            const serverLink = detailsDiv.querySelector('a[target="_blank"]')?.href || 'No link available';

            // Discord message embed
            const username = typeof cvars !== 'undefined' && cvars.name ? cvars.name : 'a user';
            const embed = {
                title: `🎮 ${serverName}`,
                color: 3447003, // Blue
                fields: [
                    { name: '🗺️ Map', value: mapInput, inline: true },
                    { name: '🔒 PIN Code', value: pinInput, inline: true },
                    { name: '🔗 Server Link', value: `[Join Server](${serverLink})`, inline: false }
                ],
                footer: {
                    text: `Shared by ${username}`
                },
                timestamp: new Date().toISOString()
            };

            const payload = {
                username: 'Server Manager Bot',
                embeds: [embed]
            };

            try {
                const response = await fetch(webhookURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast(`Server "${serverName}" shared successfully!`, 'success');
                } else {
                    const errText = await response.text();
                    console.error('Discord webhook error:', errText);
                    showToast('Failed to send to Discord. See console.', 'error');
                }
            } catch (error) {
                console.error('Discord send failed:', error);
                showToast('Network error. Could not send to Discord.', 'error');
            }
        }

        serverControls.querySelector(`#shareToDiscord_${serverId}`)?.addEventListener('click', (event) => {
            event.preventDefault();
            sendServerToDiscord(serverId, detailsDiv);
        });
        return serverControls;
    }

    // --- Discord Webhook Modal Functions ---
    let discordWebhookModal;
    let webhookInput;
    let clearBtn;
    let cancelBtn;
    let saveBtn;

    function createDiscordWebhookModal() {
        // Only create if it doesn't exist
        if (getElementById('sbd-modal')) {
            discordWebhookModal = getElementById('sbd-modal');
            webhookInput = getElementById('sbd-webhook-input');
            clearBtn = getElementById('sbd-clear-btn');
            cancelBtn = getElementById('sbd-cancel-btn');
            saveBtn = getElementById('sbd-save-btn');
            return;
        }

        discordWebhookModal = createAndAppendElement('div', document.body, { id: 'sbd-modal' }, `
            <div>
                <h3 style="margin-top:0;color:#7289da;text-align:center;">Discord Webhook Settings</h3>
                <p style="font-size:13px;margin-bottom:15px;color:#ccc;">Enter your Discord webhook URL:</p>
                <input type="url" id="sbd-webhook-input" placeholder="https://discord.com/api/webhooks/..." style="width:calc(100% - 20px);padding:10px;margin-bottom:20px;border:1px solid #4f545c;border-radius:4px;background:#40444b;color:#dcddde;font-size:14px;box-sizing:border-box;">
                <div class="sbd-buttons">
                    <button id="sbd-clear-btn">Clear</button>
                    <button id="sbd-cancel-btn">Cancel</button>
                    <button id="sbd-save-btn">Save</button>
                </div>
            </div>
        `);

        webhookInput = getElementById('sbd-webhook-input');
        clearBtn = getElementById('sbd-clear-btn');
        cancelBtn = getElementById('sbd-cancel-btn');
        saveBtn = getElementById('sbd-save-btn');

        // Load saved webhook URL
        webhookInput.value = GM_getValue('discordWebhookURL', '');

        clearBtn.addEventListener('click', () => {
            webhookInput.value = '';
            GM_deleteValue('discordWebhookURL');
            console.log('Discord Webhook URL cleared.');
            hideDiscordWebhookModal();
        });

        cancelBtn.addEventListener('click', hideDiscordWebhookModal);

        saveBtn.addEventListener('click', () => {
            const url = webhookInput.value.trim();
            if (url) {
                // Basic URL validation
                if (url.startsWith('https://discord.com/api/webhooks/')) {
                    GM_setValue('discordWebhookURL', url);
                    showToast('Webhook URL saved successfully!', 'success');
                    hideDiscordWebhookModal();
                } else {
                    showToast('Invalid webhook URL.', 'error');
                }
            } else {
                GM_deleteValue('discordWebhookURL');
                console.log('Discord Webhook URL cleared (empty input).');
                hideDiscordWebhookModal();
            }
        });

        // Close modal on outside click
        discordWebhookModal.addEventListener('click', (event) => {
            if (event.target === discordWebhookModal) {
                hideDiscordWebhookModal();
            }
        });
    }

    function showDiscordWebhookModal() {
        createDiscordWebhookModal(); // Ensure modal elements exist
        discordWebhookModal.classList.add('visible');
        webhookInput.focus();
    }

    function hideDiscordWebhookModal() {
        if (discordWebhookModal) {
            discordWebhookModal.classList.remove('visible');
        }
    }

    // --- Keyboard Shortcut for Discord Modal ---
    document.addEventListener('keydown', (event) => {
        if (event.altKey && event.shiftKey && event.key === 'D') {
            event.preventDefault(); // Prevent default browser action for the shortcut
            console.log('Alt+Shift+D pressed. Toggling Discord Webhook Settings.');
            if (discordWebhookModal && discordWebhookModal.classList.contains('visible')) {
                hideDiscordWebhookModal();
            } else {
                showDiscordWebhookModal();
            }
        }
    });

    // --- Main Script Execution ---
    function initialize() {
        GM_addStyle(CONFIG.css);
        const myServersForm = getElementById(CONFIG.mainFormId);
        if (!myServersForm) return;

        const originalTable = myServersForm.querySelector(CONFIG.originalTableSelector);
        if (!originalTable) return;

        const tbody = originalTable.querySelector('tbody');
        if (!tbody) return;

        const serverCardsContainer = createAndAppendElement('div', originalTable.parentNode, { id: CONFIG.cardContainerId });

        // Clone and reposition the original global save button
        const globalSaveButton = myServersForm.querySelector(`.${CONFIG.globalSaveButtonClass}`);
        if (globalSaveButton) {
            const globalSaveContainer = createAndAppendElement('div', myServersForm, { classList: ['global-save-button-container'] });
            const globalSaveButtonClone = globalSaveButton.cloneNode(true);
            globalSaveButtonClone.addEventListener('click', (event) => {
                // If you want to prevent reload for the global save button as well, uncomment this:
                // event.preventDefault();
                console.log('Global save button clicked.');
            });
            globalSaveContainer.appendChild(globalSaveButtonClone);
            globalSaveButton.style.display = ''; // Make sure the original global save button is visible if it was hidden
        }

        let currentServerDetailsTable = null;
        Array.from(tbody.children).forEach(row => {
            if (row.classList.contains(CONFIG.serverRowClass) && row.dataset.server) {
                const serverId = row.dataset.server;
                const currentServerCard = createAndAppendElement('div', serverCardsContainer, { classList: ['server-card'], dataset: { serverId } });
                const detailsDiv = createAndAppendElement('div', currentServerCard, { classList: ['server-card-details'] });

                const serverControls = createServerControls(serverId, currentServerCard, detailsDiv);
                detailsDiv.insertBefore(serverControls, detailsDiv.firstChild);

                currentServerDetailsTable = createAndAppendElement('table', detailsDiv, { classList: ['details-table'] });
                currentServerDetailsTable.appendChild(row);

                // --- Link Fixing (Initial check and MutationObserver) ---
                const serverLinkElement = row.querySelector(CONFIG.SELECTORS.serverLink(serverId));
                if (serverLinkElement) {
                    fixServerLink(serverLinkElement); // Fix on initial load

                    // Set up MutationObserver to watch for changes to the link element
                    const observer = new MutationObserver(mutations => {
                        for (const mutation of mutations) {
                            if (mutation.type === 'attributes' && (mutation.attributeName === 'href' || mutation.attributeName === 'style')) {
                                fixServerLink(serverLinkElement);
                            } else if (mutation.type === 'characterData' && mutation.target === serverLinkElement.firstChild) {
                                fixServerLink(serverLinkElement);
                            } else if (mutation.type === 'childList') {
                                // If child nodes change (e.g., text content is replaced)
                                fixServerLink(serverLinkElement);
                            }
                        }
                    });

                    // Observe attributes and child list (for text content changes)
                    observer.observe(serverLinkElement, { attributes: true, childList: true, subtree: true, characterData: true });
                }


                const serverNameInput = row.querySelector(CONFIG.SELECTORS.serverNameInput(serverId));
                const serverName = serverNameInput ? serverNameInput.value : `Server ${serverId}`;
                const playersPaidUntilText = row.children[3]?.textContent.trim() || 'N/A';
                const playersText = playersPaidUntilText.split('(')[0].trim();
                const paidUntilDate = playersPaidUntilText.match(/\((.*?)\)/)?.[1] || 'N/A';
                const isEnabled = row.querySelector(CONFIG.SELECTORS.serverEnabledCheckbox(serverId))?.checked;
                const isVisible = row.querySelector(CONFIG.SELECTORS.serverPublicCheckbox(serverId))?.checked;
                const mapSelect = detailsDiv.querySelector(`select[name="server[${serverId}][map]"]`);
                const mapName = mapSelect ? mapSelect.options[mapSelect.selectedIndex]?.text : 'N/A';


                const cardHeader = createAndAppendElement('div', currentServerCard, { classList: ['server-card-header'] });
                currentServerCard.insertBefore(cardHeader, detailsDiv);
                updateServerCardHeader(cardHeader, { serverName, serverId, playersText, paidUntilDate, isEnabled, isVisible, mapName });

                const enabledCheckbox = detailsDiv.querySelector(CONFIG.SELECTORS.serverEnabledCheckbox(serverId));
                const publicCheckbox = detailsDiv.querySelector(CONFIG.SELECTORS.serverPublicCheckbox(serverId));
                const updateHeaderCallback = () => {
                    const latestIsEnabled = enabledCheckbox?.checked || false;
                    const latestIsVisible = publicCheckbox?.checked || false;
                    const currentServerName = serverNameInput?.value || `Server ${serverId}`;
                    const currentCardHeader = currentServerCard.querySelector('.server-card-header');
                    const playersPaidUntilText = row.children[3]?.textContent.trim() || 'N/A';
                    const playersText = playersPaidUntilText.split('(')[0].trim();
                    const paidUntilDate = playersPaidUntilText.match(/\((.*?)\)/)?.[1] || 'N/A';
                    const currentMapSelect = detailsDiv.querySelector(`select[name="server[${serverId}][map]"]`);
                    const currentMapName = currentMapSelect ? currentMapSelect.options[currentMapSelect.selectedIndex]?.text : 'N/A';


                    updateServerCardHeader(cardHeader, { serverName: currentServerName, serverId, playersText, paidUntilDate, isEnabled: latestIsEnabled, isVisible: latestIsVisible, mapName: currentMapName });
                };

                enabledCheckbox?.addEventListener('change', updateHeaderCallback);
                publicCheckbox?.addEventListener('change', updateHeaderCallback);
                serverNameInput?.addEventListener('input', updateHeaderCallback);
                mapSelect?.addEventListener('change', updateHeaderCallback);
                cardHeader.addEventListener('click', () => toggleServerDetails(detailsDiv, cardHeader));

            } else if (currentServerDetailsTable) {
                // If it's a detail row, append it to the current server's table
                currentServerDetailsTable.appendChild(row);
            }
        });
        originalTable.style.display = 'none'; // Hide original table only after processing all rows

        // Initialize the modal so it's ready when the shortcut is pressed
        createDiscordWebhookModal();

        // --- Owner Username Fetching ---
        async function fetchAndDisplayOwnerUsername(ownerNoticeElement) {
            if (!ownerNoticeElement) return;

            const textContent = ownerNoticeElement.textContent || '';
            const match = textContent.match(/Server owner id: #(\d+)/);
            if (match && match[1]) {
                const ownerId = match[1];
                try {
                    const response = await fetch(`https://play-cs.com/rating/search/${ownerId}`);
                    if (!response.ok) {
                        console.error(`Failed to fetch owner page for ID ${ownerId}. Status: ${response.status}`);
                        return;
                    }
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const playerNameSpan = doc.querySelector('span.player_name');

                    if (playerNameSpan) {
                        const usernameElement = createAndAppendElement('div', ownerNoticeElement, {
                            classList: ['owner-username']
                        });
                        usernameElement.appendChild(document.createTextNode('Owner Username: '));
                        const profileLink = createAndAppendElement('a', usernameElement, {
                            href: `https://play-cs.com/rating/search/${ownerId}`,
                            target: '_blank'
                        });
                        profileLink.appendChild(playerNameSpan.cloneNode(true));
                    } else {
                        console.warn(`Could not find player name for owner ID ${ownerId}.`);
                    }
                } catch (error) {
                    console.error(`Error fetching or parsing owner data for ID ${ownerId}:`, error);
                }
            }
        }

        // Find all admin notices and fetch usernames
        document.querySelectorAll('.admin_notice').forEach(fetchAndDisplayOwnerUsername);

        // --- Make map selectors searchable ---
        document.querySelectorAll('select[name$="[map]"]').forEach(createSearchableDropdown);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
