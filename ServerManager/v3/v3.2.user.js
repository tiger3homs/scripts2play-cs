// ==UserScript==
// @name         CS Server Manager
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  A powerful, optimized hub for managing your play-cs.com servers.
// @author       tiger3homs (optimized by Gemini)
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
    const SCRIPT_PREFIX = 'cs_server_manager_';
    const CONFIG = {
        mainFormId: 'my-servers-form',
        originalTableSelector: 'table.table',
        serverRowClass: 'myserver',
        cardContainerId: 'server-cards-container',
        colors: [15158332, 3066993, 3447003, 15105570, 10181046, 16776960],
        css: `#my-servers-tab .myservers-card{background:linear-gradient(135deg,rgba(5,18,36,.88),rgba(12,49,87,.78));border-radius:18px;border:1px solid rgba(55,184,255,.22);padding:26px;box-shadow:0 18px 40px rgba(0,0,0,.45)}.server-card{background-color:#2a2a2a;border:1px solid #444;border-radius:8px;margin-bottom:15px;padding:15px;box-shadow:0 2px 5px rgba(0,0,0,.2);font-family:Arial,sans-serif;color:#ccc;overflow:hidden}.server-card-header{display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding-bottom:10px;border-bottom:1px solid #333;margin-bottom:10px;transition:background-color .2s}.server-card-header:hover{background-color:#333;border-radius:5px;padding:5px 10px;margin:-5px -10px 5px}.server-card-header h4{margin:0;color:#eee;font-size:1.2em}.server-card-summary{display:flex;gap:20px;font-size:.9em;color:#bbb}.server-card-summary span{display:flex;align-items:center;gap:5px}.toggle-icon{font-size:1.2em;transition:transform .2s}.server-card-header.expanded .toggle-icon{transform:rotate(90deg)}.server-card-details{display:none;margin-top:10px;padding-top:10px;border-top:1px solid #333;overflow-x:auto}.details-table{width:100%;border-collapse:collapse;margin-top:15px}.details-table th,.details-table td{border:1px solid #444;padding:8px;text-align:left;font-size:.9em;vertical-align:top}.details-table th{background-color:#333}.details-table td,.myserver{background-color:#222}:where(input[type=text],select,.input_dark){background-color:#333!important;border:1px solid #555!important;color:#eee!important;padding:5px;border-radius:4px;width:calc(100% - 12px);box-sizing:border-box}:is(.save-btn,.save-btn2,.admin_add_button){background-color:#007bff;color:#fff!important;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;font-weight:700;margin:5px 5px 0 0;text-decoration:none!important;display:inline-block;font-size:.9em}:is(.save-btn,.save-btn2):hover{background-color:#0056b3}.admin_add_button{background-color:#4CAF50}.admin_add_button:hover{background-color:#45a049}.server-controls{background-color:#1a1a1a;border:1px solid #333;border-radius:8px;padding:15px;margin-bottom:15px;display:flex;flex-direction:column;gap:15px}.control-group{display:flex;align-items:center;gap:10px}.control-group label{cursor:pointer;background-color:#333;border:1px solid #555;border-radius:5px;padding:7px 10px;transition:background-color .2s;font-size:.9em}.control-group input[type=radio]{display:none}.control-group input[type=radio]:checked+label{background-color:#007bff;border-color:#007bff;color:#fff;font-weight:700}.control-map{display:flex;align-items:center;gap:10px}.map-picker{display:flex;gap:5px;flex-wrap:wrap}.map-picker img{width:100px;height:40px;cursor:pointer;border:2px solid transparent;border-radius:5px;transition:border-color .2s;object-fit:cover;background-color:#2a2a2a}.map-picker img:hover{border-color:#00aaff}.map-picker img.selected{border-color:#007bff;box-shadow:0 0 5px #007bff}.action-buttons{display:flex;gap:10px;width:100%;justify-content:flex-end}.action-buttons button{color:#fff;padding:9px 15px;border:none;border-radius:5px;cursor:pointer;font-weight:700;font-size:.95em}.action-buttons button:hover{background-color:#0056b3}.discord-btn{background-color:#7289da}.discord-btn:hover{background-color:#6778c4}.copy-link-btn{background-color:#17a2b8}.copy-link-btn:hover{background-color:#138496}.save-preset-btn{background-color:#28a745}.save-preset-btn:hover{background-color:#218838}.save-btn3{background:#0056b3;border:1px solid rgba(83,193,255,.45);color:#053252;padding:10px 24px;text-align:center;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:600;cursor:pointer;border-radius:999px;letter-spacing:.08em;text-transform:uppercase;transition:transform .2s ease,box-shadow .2s ease,background .2s ease}.save-btn3:hover{transform:translateY(-1px);box-shadow:0 12px 24px rgba(55,184,255,.35);background:linear-gradient(135deg,#fff 0,#d5f3ff 100%);color:#053252}.save-btn3:disabled{opacity:.6;cursor:not-allowed;box-shadow:none}#my-servers-form .table thead,#my-servers-form>.save-btn3{display:none}#my-servers-form .mode-presets{display:none!important}#my-servers-tab .myservers-inline-actions__cell{display:none!important}.preset-container{display:inline-flex;align-items:center;margin-right:5px}.delete-preset-btn{background:#dc3545;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;margin-left:-8px;z-index:1;font-size:14px;line-height:20px;text-align:center;padding:0}.delete-preset-btn:hover{background:#c82333}.control-group label{border-top-right-radius:0;border-bottom-right-radius:0}.flag-selector{display:flex;align-items:center;padding-left:80px;gap:8px}.flag-icon{font-size:1.5em;cursor:pointer;opacity:.6;transition:opacity .2s,transform .2s}.flag-icon:hover{opacity:1;transform:scale(1.1)}.flag-icon.selected{opacity:1;transform:scale(1.1);border-bottom:2px solid #00aaff}#sbd-modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);display:flex;justify-content:center;align-items:center;z-index:10001;visibility:hidden;opacity:0;transition:visibility 0s,opacity .3s}#sbd-modal.visible{visibility:visible;opacity:1}#sbd-modal>div{background:#2c2f33;padding:25px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,.3);width:450px;max-width:90%;color:#ddd}#sbd-modal h3{margin-top:0;color:#7289da;text-align:center}#sbd-webhook-input{width:100%;padding:10px;margin-bottom:20px;border:1px solid #4f545c;border-radius:4px;background:#40444b;color:#ddd;box-sizing:border-box}#sbd-modal .sbd-buttons{display:flex;justify-content:flex-end;gap:10px}#sbd-modal .sbd-buttons button{padding:10px 20px;border:none;border-radius:4px;color:#fff;cursor:pointer;flex-grow:1}#sbd-clear-btn{background:#e74c3c}#sbd-clear-btn:hover{background:#c0392b}#sbd-cancel-btn{background:#747f8d}#sbd-cancel-btn:hover{background:#5f6a7b}#sbd-save-btn{background:#7289da}#sbd-save-btn:hover{background:#6778c4}#toast-container{position:fixed;top:20px;right:20px;z-index:10002;display:flex;flex-direction:column;gap:10px}.toast{background-color:#333;color:#eee;padding:15px 20px;border-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,.2);opacity:0;transition:opacity .3s,transform .3s;transform:translateX(100%);border-left:5px solid #555}.toast.show{opacity:1;transform:translateX(0)}.toast.success{background-color:#28a745;border-left-color:#218838;color:#fff}.toast.error{background-color:#dc3545;border-left-color:#c82333;color:#fff}.toast.info{background-color:#17a2b8;border-left-color:#138496;color:#fff}`
    };
    const DEFAULT_PRESETS = {
        public: { isDefault: true, checkboxes: { enabled: true, public: true, mp_clanwar: true, amx_giveammo: true, mp_friendlyfire: false, mp_autoteambalance: true, mp_afkbomb: true, mp_restarter: true, afk_kick: true, perks: true, statistics: true, chickens: true, rnd_death: true, votekick: true, bonus_slot: true, tfb: true, statsx: true, dib3: true, rwd_grenadedrop: true, }, cvars: { mp_rs_rounds: '200', pb_maxbots: '6', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '1.75', mp_buytime: '0.25', mp_c4timer: '35', mp_freezetime: '0', mp_startmoney: '16000', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', } },
        '5vs5': { isDefault: true, checkboxes: { enabled: true, public: false, mp_clanwar: true, nobombscore_enabled: true, bonus_slot: true, mp_friendlyfire: true, rwd_grenadedrop: true, }, cvars: { mp_rs_rounds: '25', pb_maxbots: '0', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '1.75', mp_buytime: '0.25', mp_c4timer: '35', mp_freezetime: '15', mp_startmoney: '800', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', } },
        deathmatch: { isDefault: true, checkboxes: { enabled: true, public: true, mp_friendlyfire: true, mp_autoteambalance: true, mp_afkbomb: true, afk_kick: true, statistics: true, votekick: true, bonus_slot: true, tfb: true, statsx: true, dib3: false, rwd_grenadedrop: true, }, cvars: { mp_rs_rounds: '200', pb_maxbots: '6', minimal_skill: '0', ping_limit: '1000', mp_roundtime: '2.5', mp_buytime: '0.5', mp_c4timer: '35', mp_freezetime: '0', mp_startmoney: '1000', csem_sank_cd: '300', limit_hegren: '1', limit_sgren: '1', limit_flash: '2', } }
    };
    let PRESET_DATA = {};

    // --- 2. HELPERS ---
    const createEl = (tag, parent, attrs = {}, html = '') => {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'classList') el.classList.add(...value);
            else if (key === 'dataset') Object.assign(el.dataset, value);
            else el.setAttribute(key, value);
        });
        if (html) el.innerHTML = html;
        if (parent) parent.appendChild(el);
        return el;
    };

    const showToast = (message, type = 'info', duration = 4000) => {
        let container = document.getElementById('toast-container') || createEl('div', document.body, { id: 'toast-container' });
        const toast = createEl('div', container, { classList: ['toast', type] }, message);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    };

    const fixServerLink = (linkElement) => {
        if (!linkElement) return;
        let href = linkElement.getAttribute('href') || '';
        if (href.startsWith('://')) {
            linkElement.setAttribute('href', `https${href}`);
        }
    };

    // --- 3. UI & FEATURE MODULES ---

    const manageDiscordModal = (action = 'toggle') => {
        let modal = document.getElementById('sbd-modal');
        if (!modal) {
            modal = createEl('div', document.body, { id: 'sbd-modal' }, `
                <div><h3>Discord Webhook Settings</h3><p>Enter your URL to use the 'Share to Discord' feature.</p>
                <input type="url" id="sbd-webhook-input" placeholder="https://discord.com/api/webhooks/..."><div class="sbd-buttons">
                <button id="sbd-clear-btn">Clear</button><button id="sbd-cancel-btn">Cancel</button><button id="sbd-save-btn">Save</button>
                </div></div>`);
            modal.addEventListener('click', e => {
                const target = e.target;
                const input = document.getElementById('sbd-webhook-input');
                if (target.id === 'sbd-modal' || target.id === 'sbd-cancel-btn') manageDiscordModal('hide');
                else if (target.id === 'sbd-clear-btn') {
                    input.value = '';
                    GM_deleteValue(`${SCRIPT_PREFIX}discordWebhookURL`);
                    manageDiscordModal('hide');
                } else if (target.id === 'sbd-save-btn') {
                    const url = input.value.trim();
                    if (url && url.startsWith('https://discord.com/api/webhooks/')) {
                        GM_setValue(`${SCRIPT_PREFIX}discordWebhookURL`, url);
                        showToast('Webhook URL saved!', 'success');
                        manageDiscordModal('hide');
                    } else if (url) showToast('Invalid webhook URL.', 'error');
                    else {
                        GM_deleteValue(`${SCRIPT_PREFIX}discordWebhookURL`);
                        manageDiscordModal('hide');
                    }
                }
            });
        }
        if (action === 'show' || (action === 'toggle' && !modal.classList.contains('visible'))) {
            document.getElementById('sbd-webhook-input').value = GM_getValue(`${SCRIPT_PREFIX}discordWebhookURL`, '');
            modal.classList.add('visible');
            document.getElementById('sbd-webhook-input').focus();
        } else {
            modal.classList.remove('visible');
        }
    };

    const loadPresets = () => {
        PRESET_DATA = GM_getValue(`${SCRIPT_PREFIX}presets`, null) || JSON.parse(JSON.stringify(DEFAULT_PRESETS));
    };

    const savePresets = () => GM_setValue(`${SCRIPT_PREFIX}presets`, PRESET_DATA);

    const updatePresetControls = (container, serverId) => {
        container.innerHTML = '<span>MODE:</span>' + Object.keys(PRESET_DATA).map(name => `
            <span class="preset-container">
                <input type="radio" id="mode_${name}_${serverId}" name="gameMode_${serverId}" value="${name}">
                <label for="mode_${name}_${serverId}">${name}</label>
                ${!PRESET_DATA[name].isDefault ? `<button type="button" class="delete-preset-btn" data-preset-name="${name}">&times;</button>` : ''}
            </span>`).join('');
    };

    const applyPreset = (presetName, card) => {
        const preset = PRESET_DATA[presetName];
        if (!preset) return;
        const serverId = card.dataset.serverId;
        card.querySelectorAll('input[type="checkbox"][id*="[cvars]"], input[id*="[public]"], input[id*="[enabled]"]').forEach(cb => cb.checked = false);
        Object.entries(preset.checkboxes).forEach(([key, value]) => {
            const el = card.querySelector(`input[id="server[${serverId}][cvars][${key}]"], input[id="server[${serverId}][${key}]"]`);
            if (el) el.checked = value;
        });
        Object.entries(preset.cvars).forEach(([key, value]) => {
            const el = card.querySelector(`select[name="server[${serverId}][cvars][${key}]"]`);
            if (el) el.value = value;
        });
        card.dispatchEvent(new Event('updateHeader', { bubbles: true }));
        card.style.outline = '2px solid orange';
        setTimeout(() => card.style.outline = '', 1500);
    };

    const savePreset = (card) => {
        const presetName = prompt('Enter a name for this preset:', '');
        if (!presetName?.trim()) return showToast('Preset name cannot be empty.', 'error');
        if (PRESET_DATA[presetName] && !confirm(`Preset "${presetName}" already exists. Overwrite it?`)) return;

        const newPreset = { isDefault: false, checkboxes: {}, cvars: {} };
        card.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            const match = cb.id.match(/server\[\d+\]\[(cvars)\]\[(.+)\]/) || cb.id.match(/server\[\d+\]\[(public|enabled)\]/);
            if (match) newPreset.checkboxes[match[2] || match[1]] = cb.checked;
        });
        card.querySelectorAll('select').forEach(sel => {
            const match = sel.name.match(/server\[\d+\]\[cvars\]\[(.+)\]/);
            if (match) newPreset.cvars[match[1]] = sel.value;
        });
        PRESET_DATA[presetName] = newPreset;
        savePresets();
        showToast(`Preset "${presetName}" saved!`, 'success');
        document.querySelectorAll('.server-card').forEach(c => {
            updatePresetControls(c.querySelector('.control-group'), c.dataset.serverId);
        });
    };

    const deletePreset = (presetName) => {
        if (!PRESET_DATA[presetName] || PRESET_DATA[presetName].isDefault) return showToast('Cannot delete a default preset.', 'error');
        if (confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
            delete PRESET_DATA[presetName];
            savePresets();
            showToast(`Preset "${presetName}" deleted.`, 'success');
            document.querySelectorAll('.server-card').forEach(c => {
                updatePresetControls(c.querySelector('.control-group'), c.dataset.serverId);
            });
        }
    };

    async function shareToServer(card, type) {
        const serverId = card.dataset.serverId;
        const serverLink = card.querySelector(`tr[data-server="${serverId}"] a[target="_blank"]`)?.href;
        const pin = card.querySelector(`input[name="pin_${serverId}"]`)?.value ?? 'N/A';
        if (!serverLink) return showToast('Could not find server link.', 'error');

        if (type === 'copy') {
            try {
                await navigator.clipboard.writeText(`${serverLink}\n\n\n${pin}`);
                showToast('Server link and PIN copied!', 'success');
            } catch (err) {
                showToast('Failed to copy link.', 'error');
            }
        } else if (type === 'discord') {
            const webhookURL = GM_getValue(`${SCRIPT_PREFIX}discordWebhookURL`, '');
            if (!webhookURL) {
                showToast('Set your Discord webhook URL first.', 'info');
                return manageDiscordModal('show');
            }
            const serverName = card.querySelector(`input[name="server[${serverId}][name]"]`)?.value || `Server ${serverId}`;
            const mapName = card.querySelector(`select[name="server[${serverId}][map]"] option:checked`)?.textContent || 'N/A';
            const payload = {
                username: 'Server Manager Bot',
                embeds: [{
                    title: `🎮 ${serverName}`, color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
                    fields: [{ name: '🗺️ Map', value: mapName, inline: true }, { name: '🔒 PIN', value: pin, inline: true }, { name: '🔗 Join Link', value: serverLink, inline: false }],
                    footer: { text: `Shared by ${unsafeWindow.cvars?.name ?? 'a user'}` }, timestamp: new Date().toISOString()
                }]
            };
            try {
                const response = await fetch(webhookURL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (response.ok) showToast(`Server "${serverName}" shared!`, 'success');
                else {
                    showToast('Discord webhook error. See console.', 'error');
                    console.error('Discord Error:', await response.text());
                }
            } catch (error) {
                showToast('Network error sending to Discord.', 'error');
            }
        }
    }

    const createFlagSelector = (originalSelect) => {
        const container = createEl('div', null, { classList: ['flag-selector'] });
        originalSelect.parentNode.insertBefore(container, originalSelect);
        originalSelect.style.display = 'none';
        const flags = Array.from(originalSelect.options).map(opt =>
            createEl('span', container, { classList: ['flag-icon', `flag-icon-${opt.value === 'ny' ? 'us' : opt.value}`], dataset: { value: opt.value }, title: opt.textContent })
        );
        const updateSelection = () => flags.forEach(f => f.classList.toggle('selected', f.dataset.value === originalSelect.value));
        container.addEventListener('click', e => {
            if (e.target.classList.contains('flag-icon')) {
                originalSelect.value = e.target.dataset.value;
                originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        originalSelect.addEventListener('change', updateSelection);
        new MutationObserver(updateSelection).observe(originalSelect, { attributes: true, attributeFilter: ['value'] });
        updateSelection();
    };

    const makeCollapsible = (header, content) => {
        if (!header || !content) return;
        header.style.cursor = 'pointer';
        content.style.display = 'none';
        header.innerHTML += ' <span class="toggle-icon">&#x25B6;</span>';
        header.addEventListener('click', () => {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            header.querySelector('.toggle-icon').innerHTML = isHidden ? '&#x25BC;' : '&#x25B6;';
        });
    };

    const updateServerCardHeader = (card) => {
        const serverId = card.dataset.serverId;
        const header = card.querySelector('.server-card-header');
        if (!header) return;
        const name = card.querySelector(`input[name="server[${serverId}][name]"]`)?.value ?? `Server ${serverId}`;
        const mapSelect = card.querySelector(`select[name="server[${serverId}][map]"]`);
        const mapName = mapSelect?.options[mapSelect.selectedIndex]?.text ?? 'N/A';
        const playersPaidText = card.dataset.playersPaidText ?? '';
        const isEnabled = card.querySelector(`input[id="server[${serverId}][enabled]"]`)?.checked;
        const isVisible = card.querySelector(`input[id="server[${serverId}][public]"]`)?.checked;

        header.innerHTML = `
            <h4>${name} ${serverId}</h4>
            <div class="server-card-summary">
                <span><i class="fa fa-map-marker"></i> ${mapName}</span>
                <span><i class="fa fa-users"></i> ${playersPaidText.split('(')[0].trim()}</span>
                <span><i class="fa fa-calendar"></i> ${playersPaidText.match(/\((.*?)\)/)?.[1] ?? 'N/A'}</span>
                <span><i class="fa fa-power-off" style="color:${isEnabled ? '#4CAF50' : '#dc3545'};"></i> ${isEnabled ? 'Enabled' : 'Disabled'}</span>
                <span><i class="fa fa-eye" style="color:${isVisible ? '#00aaff' : '#888'};"></i> ${isVisible ? 'Visible' : 'Hidden'}</span>
            </div>
            <span class="toggle-icon">${card.querySelector('.server-card-details').style.display === 'none' ? '&#x25B6;' : '&#x25BC;'}</span>`;
    };

    const createServerCard = (mainRow, detailRows) => {
        const serverId = mainRow.dataset.server;
        const card = createEl('div', null, { classList: ['server-card'], dataset: { serverId } });
        card.dataset.playersPaidText = mainRow.children[3]?.textContent.trim() ?? '';

        createEl('div', card, { classList: ['server-card-header'] }); // Placeholder for header
        const detailsDiv = createEl('div', card, { classList: ['server-card-details'] });

        const serverControls = createEl('div', detailsDiv, { classList: ['server-controls'] });
        const topControls = createEl('div', serverControls, { style: "display: flex; width: 100%; gap: 15px;" });
        const controlGroup = createEl('div', topControls, { classList: ['control-group'] });
        updatePresetControls(controlGroup, serverId);

        // Map Picker
        const mapPickerHtml = ['de_dust2', 'de_inferno', 'de_mirage', 'de_nuke', 'de_tuscan', 'de_train', 'de_cache_v2']
            .map(map => `<img src="https://placehold.co/100x40/2a2a2a/ffffff?font=roboto&text=${map.replace('de_', '')}" title="${map}" data-map="${map}" alt="${map}" loading="lazy">`).join('');
        createEl('div', topControls, { classList: ['control-map'] }, `<span>MAP:</span><div class="map-picker">${mapPickerHtml}</div>`);

        const actionButtons = createEl('div', serverControls, { classList: ['action-buttons'] });
        actionButtons.innerHTML = `<button type="button" class="save-preset-btn"><i class="fa fa-save"></i> Save Preset</button>
                                   <button type="button" class="copy-link-btn"><i class="fa fa-clipboard"></i> Copy Link</button>
                                   <button type="button" class="discord-btn"><i class="fa fa-discord"></i> Share to Discord</button>`;
        const globalSaveBtn = document.querySelector(`#${CONFIG.mainFormId} .save-btn3`);
        if (globalSaveBtn) actionButtons.appendChild(globalSaveBtn.cloneNode(true));

        const detailsTable = createEl('table', detailsDiv, { classList: ['details-table'] });
        detailsTable.appendChild(mainRow);
        detailRows.forEach(row => detailsTable.appendChild(row));

        // Fix server link which might have a broken protocol
        const serverLink = mainRow.querySelector(`a[target="_blank"]`);
        if (serverLink) { // Check if serverLink exists before calling fixServerLink
            fixServerLink(serverLink); // Call the helper function
            // Set up observer to re-apply the fix if the link changes
            new MutationObserver(() => fixServerLink(serverLink))
                .observe(serverLink, { attributes: true, childList: true, subtree: true, characterData: true });
        }

        card.addEventListener('updateHeader', () => updateServerCardHeader(card));
        card.addEventListener('change', () => card.dispatchEvent(new Event('updateHeader')));
        card.addEventListener('input', e => {
            if (e.target.matches(`input[name="server[${serverId}][name]"]`)) {
                card.dispatchEvent(new Event('updateHeader'));
            }
        });

        // Initialize header
        updateServerCardHeader(card);
        return card;
    };


    // --- 4. INITIALIZATION ---
    function initialize() {
        loadPresets();
        GM_addStyle(CONFIG.css);
        const myServersForm = document.getElementById(CONFIG.mainFormId);
        if (!myServersForm) return;

        makeCollapsible(document.querySelector('.myservers-card--new .myservers-card__header'), document.querySelector('.myservers-card--new .myservers-card__body'));
        makeCollapsible(document.querySelector('.myservers-card--specs .myservers-card__header'), document.querySelector('.myservers-card--specs .myservers-card__body'));

        const originalTable = myServersForm.querySelector(CONFIG.originalTableSelector);
        const tbody = originalTable?.querySelector('tbody');
        if (!tbody) return;

        const cardContainer = createEl('div', originalTable.parentNode, { id: CONFIG.cardContainerId });
        originalTable.parentNode.insertBefore(cardContainer, originalTable);

        const rows = Array.from(tbody.children);
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.classList.contains(CONFIG.serverRowClass) && row.dataset.server) {
                const detailRows = [];
                let nextIndex = i + 1;
                while (nextIndex < rows.length && !rows[nextIndex].classList.contains(CONFIG.serverRowClass)) {
                    detailRows.push(rows[nextIndex++]);
                }
                cardContainer.appendChild(createServerCard(row, detailRows));
                i = nextIndex - 1;
            }
        }
        originalTable.style.display = 'none';

        // Delegated Event Listeners
        cardContainer.addEventListener('click', e => {
            const card = e.target.closest('.server-card');
            if (!card) return;

            // Header toggles details
            if (e.target.closest('.server-card-header')) {
                const details = card.querySelector('.server-card-details');
                const header = card.querySelector('.server-card-header');
                const isHidden = details.style.display === 'none';
                details.style.display = isHidden ? 'block' : 'none';
                header.classList.toggle('expanded', isHidden);
                header.querySelector('.toggle-icon').innerHTML = isHidden ? '&#x25BC;' : '&#x25B6;';
            }
            // Button clicks
            else if (e.target.matches('.copy-link-btn')) shareToServer(card, 'copy');
            else if (e.target.matches('.discord-btn')) shareToServer(card, 'discord');
            else if (e.target.matches('.save-preset-btn')) savePreset(card);
            else if (e.target.matches('.delete-preset-btn')) deletePreset(e.target.dataset.presetName);
            // Map picker image click
            else if (e.target.matches('.map-picker img')) {
                const mapName = e.target.dataset.map;
                const mapSelect = card.querySelector(`select[name="server[${card.dataset.serverId}][map]"]`);
                if(mapSelect) {
                    mapSelect.value = mapName;
                    mapSelect.dispatchEvent(new Event('change', { bubbles: true })); // Trigger update
                }
                card.querySelectorAll('.map-picker img').forEach(img => img.classList.remove('selected'));
                e.target.classList.add('selected');
            }
        });

        cardContainer.addEventListener('change', e => {
            if (e.target.matches('input[name^="gameMode_"]')) {
                applyPreset(e.target.value, e.target.closest('.server-card'));
            }
        });

        // Final UI enhancements
        document.querySelectorAll('select[name$="[country]"]').forEach(createFlagSelector);
        document.addEventListener('keydown', e => {
            if (e.altKey && e.shiftKey && e.key.toUpperCase() === 'D') {
                e.preventDefault();
                manageDiscordModal('toggle');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
