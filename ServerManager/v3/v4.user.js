// ==UserScript==
// @name         CS Server Manager v4
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Enhances the play-cs.com/myservers page with custom presets, Discord integration, and other QoL features.
// @author       tiger3homs & Cline
// @match        https://play-cs.com/myservers
// @match        https://play-cs.com/*/myservers
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function($) {
    'use strict';

    // --- 1. CONFIGURATION & CONSTANTS ---

    const CONFIG = {
        storageKey: 'serverManagerPresets_v4',
        colors: [15158332, 3066993, 3447003, 15105570, 10181046, 16776960], // Red, Green, Blue, Orange, Purple, Yellow
        css: `
            /* Custom Buttons */
            .custom-action-btn {
                background-color: #007bff;
                color: white !important;
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                margin-left: 5px;
                text-decoration: none !important;
                display: inline-block;
                font-size: 0.9em;
                line-height: 1.5;
            }
            .custom-action-btn:hover { background-color: #0056b3; }
            .discord-btn { background-color: #7289da; }
            .discord-btn:hover { background-color: #6778c4; }
            .copy-link-btn { background-color: #17a2b8; }
            .copy-link-btn:hover { background-color: #138496; }
            .save-preset-btn { background-color: #28a745; }
            .save-preset-btn:hover { background-color: #218838; }

            /* Preset Controls */
            .preset-container { display: inline-flex; align-items: center; margin-right: 5px; }
            .delete-preset-btn {
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                cursor: pointer;
                margin-left: -8px;
                z-index: 1;
                font-size: 14px;
                line-height: 20px;
                text-align: center;
                padding: 0;
            }
            .delete-preset-btn:hover { background: #c82333; }

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

    let PRESET_DATA = {};

    // --- 2. FEATURE MODULES ---

    /** Load presets from storage */
    function loadPresets() {
        const storedPresets = GM_getValue(CONFIG.storageKey, null);
        PRESET_DATA = storedPresets ? JSON.parse(storedPresets) : {};
    }

    /** Save presets to storage */
    function savePresets() {
        GM_setValue(CONFIG.storageKey, JSON.stringify(PRESET_DATA));
    }

    /** Update the preset controls in the UI */
    function updatePresetControls(container, serverId) {
        const customPresets = Object.keys(PRESET_DATA);
        if (customPresets.length > 0) {
            container.find('.custom-preset-btn, .delete-preset-btn').remove(); // Clear old custom buttons
            customPresets.forEach(presetName => {
                const presetContainer = $('<span class="preset-container"></span>');
                const button = $(`<button type="button" class="mode-presets__button custom-preset-btn">${presetName}</button>`);
                button.on('click', () => applyPreset(presetName, serverId));
                presetContainer.append(button);

                const deleteBtn = $(`<button type="button" class="delete-preset-btn" title="Delete preset">&times;</button>`);
                deleteBtn.on('click', (e) => {
                    e.stopPropagation();
                    deletePreset(presetName, serverId);
                });
                presetContainer.append(deleteBtn);
                container.append(presetContainer);
            });
        }
    }

    /** Save the current server settings as a new preset */
    function savePreset(serverId) {
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

        const newPreset = { checkboxes: {}, cvars: {} };
        const serverRow = $(`tr.myserver[data-server="${serverId}"]`);
        const detailsRows = serverRow.nextUntil('tr.myserver');
        const context = detailsRows.find('.my-server-cvars');

        // Get all checkbox values
        context.find('input[type="checkbox"][name*="[cvars]"]').each(function() {
            const name = $(this).attr('name').match(/\[cvars\]\[(.*?)\]/)[1];
            newPreset.checkboxes[name] = this.checked;
        });
         // Also check for 'public' and 'enabled' checkboxes in the main row
        $(`input[name="server[${serverId}][public]"]`).each(function() { newPreset.checkboxes['public'] = this.checked; });
        $(`input[name="server[${serverId}][enabled]"]`).each(function() { newPreset.checkboxes['enabled'] = this.checked; });


        // Get all select (cvar) values
        context.find('select[name*="[cvars]"]').each(function() {
            const name = $(this).attr('name').match(/\[cvars\]\[(.*?)\]/)[1];
            newPreset.cvars[name] = $(this).val();
        });

        PRESET_DATA[presetName] = newPreset;
        savePresets();
        showToast(`Preset "${presetName}" saved!`, 'success');

        // Refresh all preset controls on the page
        $('.mode-presets').each(function() {
            const id = $(this).closest('tr.myserver-details').prevAll('tr.myserver').data('server');
            updatePresetControls($(this), id);
        });
    }

    /** Delete a custom preset */
    function deletePreset(presetName, serverId) {
        if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
            delete PRESET_DATA[presetName];
            savePresets();
            showToast(`Preset "${presetName}" deleted.`, 'success');
            // Refresh all preset controls on the page
            $('.mode-presets').each(function() {
                const id = $(this).closest('tr.myserver-details').prevAll('tr.myserver').data('server');
                updatePresetControls($(this), id);
            });
        }
    }

    /** Apply Server Configuration Preset */
    function applyPreset(presetName, serverId) {
        const preset = PRESET_DATA[presetName];
        if (!preset) return;

        // Apply checkboxes
        Object.entries(preset.checkboxes).forEach(([key, value]) => {
            let selector = `input[name="server[${serverId}][cvars][${key}]"]`;
            if (key === 'public' || key === 'enabled') {
                 selector = `input[name="server[${serverId}][${key}]"]`;
            }
            const checkbox = $(selector);
            if (checkbox.length) {
                checkbox.prop('checked', value).trigger('change');
            }
        });

        // Apply cvars
        Object.entries(preset.cvars).forEach(([key, value]) => {
            const select = $(`select[name="server[${serverId}][cvars][${key}]"]`);
            if (select.length) {
                select.val(value).trigger('change');
            }
        });

        showToast(`Preset "${presetName}" applied!`, 'info');
        const serverCard = $(`tr.myserver[data-server="${serverId}"]`);
        serverCard.css('outline', '2px solid orange');
        setTimeout(() => serverCard.css('outline', ''), 1500);
    }

    /** Discord Webhook Modal */
    let discordWebhookModal;
    function createDiscordWebhookModal() {
        if ($('#sbd-modal').length) return;
        discordWebhookModal = $(`
            <div id="sbd-modal">
                <div>
                    <h3>Discord Webhook Settings</h3>
                    <p>Enter your Discord webhook URL to use the 'Share to Discord' feature.</p>
                    <input type="url" id="sbd-webhook-input" placeholder="https://discord.com/api/webhooks/...">
                    <div class="sbd-buttons">
                        <button id="sbd-clear-btn">Clear</button>
                        <button id="sbd-cancel-btn">Cancel</button>
                        <button id="sbd-save-btn">Save</button>
                    </div>
                </div>
            </div>
        `).appendTo('body');

        const webhookInput = $('#sbd-webhook-input');
        webhookInput.val(GM_getValue('discordWebhookURL', ''));

        $('#sbd-clear-btn').on('click', () => {
            webhookInput.val('');
            GM_deleteValue('discordWebhookURL');
            hideDiscordWebhookModal();
        });
        $('#sbd-cancel-btn').on('click', hideDiscordWebhookModal);
        $('#sbd-save-btn').on('click', () => {
            const url = webhookInput.val().trim();
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
        discordWebhookModal.on('click', e => {
            if (e.target === discordWebhookModal[0]) hideDiscordWebhookModal();
        });
    }
    function showDiscordWebhookModal() {
        if (!discordWebhookModal || !discordWebhookModal.length) createDiscordWebhookModal();
        discordWebhookModal.addClass('visible');
        $('#sbd-webhook-input').focus();
    }
    function hideDiscordWebhookModal() {
        if (discordWebhookModal) discordWebhookModal.removeClass('visible');
    }

    /** Share Server Info to Discord */
    async function sendServerToDiscord(serverId) {
        const webhookURL = GM_getValue('discordWebhookURL', '');
        if (!webhookURL) {
            showToast('Set your Discord webhook URL first (Alt+Shift+D).', 'info');
            showDiscordWebhookModal();
            return;
        }

        const serverRow = $(`tr.myserver[data-server="${serverId}"]`);
        const serverName = serverRow.find(`input[name="server[${serverId}][name]"]`).val() || `Server ${serverId}`;
        const mapName = serverRow.find(`select[name="server[${serverId}][map]"] option:checked`).text().trim() || 'N/A';
        const pin = $(`#pin_${serverId}`).val() || 'None';
        const serverLink = serverRow.find(`a[target="_blank"]`).attr('href') || 'No link';
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
                footer: { text: `Shared from play-cs.com` },
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

    /** Copy Server Link and PIN to Clipboard */
    async function copyServerLinkToClipboard(serverId) {
        const serverRow = $(`tr.myserver[data-server="${serverId}"]`);
        const serverLink = serverRow.find(`a[target="_blank"]`).attr('href') || '';
        const pin = $(`#pin_${serverId}`).val() || '';

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

    /** Fix Broken Server Links */
    const fixServerLink = (linkElement) => {
        if (!linkElement) return;
        let href = $(linkElement).attr('href') || '';
        if (href.startsWith('://')) {
            $(linkElement).attr('href', `https${href}`);
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
                const ownerDiv = createAndAppendElement('div', ownerNoticeElement, { class: 'owner-username' }, 'Owner: ');
                const profileLink = createAndAppendElement('a', ownerDiv, { href: `https://play-cs.com/rating/search/${ownerId}`, target: '_blank' });
                profileLink.appendChild(playerNameSpan.cloneNode(true));
            }
        } catch (error) {
            console.error(`Error fetching owner data for ID ${ownerId}:`, error);
        }
    }


    // --- 2. CORE MODULES ---

    /** DOM Helper Functions */
    const getElementById = (id) => document.getElementById(id);
    const createAndAppendElement = (tagName, parent, attributes = {}, innerHTML = '') => {
        const element = $(tagName, attributes);
        if (innerHTML) {
            element.html(innerHTML);
        }
        $(parent).append(element);
        return element[0];
    };

    /** Toast Notification System */
    let toastContainer = null;
    function showToast(message, type = 'info', duration = 4000) {
        if (!toastContainer) {
            toastContainer = createAndAppendElement('div', document.body, { id: 'toast-container' });
        }
        const toast = $(createAndAppendElement('div', toastContainer, { class: `toast ${type}` }, message));
        setTimeout(() => toast.addClass('show'), 10);
        setTimeout(() => {
            toast.removeClass('show');
            toast.on('transitionend', () => toast.remove());
        }, duration);
    }


    // --- 3. INITIALIZATION ---

    function initialize() {
        console.log("CS Server Manager v4 Initializing...");
        GM_addStyle(CONFIG.css);
        loadPresets();
        createDiscordWebhookModal();

        $(document).on('keydown', e => {
            if (e.altKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                e.preventDefault();
                if (discordWebhookModal?.hasClass('visible')) {
                    hideDiscordWebhookModal();
                } else {
                    showDiscordWebhookModal();
                }
            }
        });

        // Find each server and enhance it
        $('tr.myserver[data-server]').each(function() {
            const serverRow = $(this);
            const serverId = serverRow.data('server');
            const detailsRows = serverRow.nextUntil('tr.myserver');
            const cvarsCell = detailsRows.find('.my-server-cvars');
            const actionsCell = detailsRows.find('td[valign="top"][align="right"]');
            const pinCell = detailsRows.find('.myservers-table__cell--pin');

            // 1. Enhance Preset Controls
            if (cvarsCell.length) {
                const presetContainer = cvarsCell.find('.mode-presets');
                if (presetContainer.length) {
                    updatePresetControls(presetContainer, serverId);
                }
            }

            // 2. Add Action Buttons
            if (actionsCell.length) {
                 const savePresetBtn = $(`<div class="save-btn save-preset-btn custom-action-btn" title="Save current settings as a new preset"><i class="fa fa-save"></i> Save as Preset</div>`);
                 savePresetBtn.on('click', () => savePreset(serverId));
                 actionsCell.append(savePresetBtn);

                 const discordBtn = $(`<div class="save-btn discord-btn custom-action-btn" title="Share server info to Discord"><i class="fa fa-discord"></i> Share to Discord</div>`);
                 discordBtn.on('click', () => sendServerToDiscord(serverId));
                 actionsCell.append(discordBtn);

                 const copyLinkBtn = $(`<div class="save-btn copy-link-btn custom-action-btn" title="Copy server link and PIN to clipboard"><i class="fa fa-clipboard"></i> Copy Link & PIN</div>`);
                 copyLinkBtn.on('click', () => copyServerLinkToClipboard(serverId));
                 actionsCell.append(copyLinkBtn);
            }

            // 3. Fix Server Link
            const serverLinkElement = serverRow.find('a[target="_blank"]');
            if (serverLinkElement.length) {
                fixServerLink(serverLinkElement[0]);
            }

            // 4. Fetch Owner Username
            const ownerNotice = detailsRows.find('.admin_notice');
            if(ownerNotice.length) {
                ownerNotice.each(function() {
                    fetchAndDisplayOwnerUsername(this);
                });
            }
        });
    }

    // Wait for the page to be fully loaded before running the script
    $(window).on('load', function () {
        // A small delay to ensure all site scripts have initialized
        setTimeout(initialize, 500);
    });

})(jQuery);
