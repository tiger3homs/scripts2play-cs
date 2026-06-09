// ==UserScript==
// @name         Server List Grid ↔ Line Toggle (Persistent)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Toggle servers between card grid and line list view with a button in the toolbar, and save the choice in localStorage so it stays after reloads. Optimized for speed and efficiency.
// @author       tiger3homs aka (obbe.00 on discord)
// @match        https://play-cs.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = "serverViewMode";
    const SERVERS_CONTAINER_SELECTOR = '#servers-container';
    const TOOLBAR_SELECTOR = '.servers-modern-toolbar__actions';
    const VIEW_TOGGLE_BTN_CLASS = 'view-toggle-btn';
    const LINE_VIEW_CLASS = 'line-view';
    const STYLE_ID = 'server-list-line-view-styles';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .servers-grid { display: block !important; }
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card {
                display: flex !important; flex-direction: row !important; align-items: center;
                justify-content: flex-start; gap: 12px; padding: 8px 12px; margin-bottom: 6px;
                border-radius: 8px; font-size: 13px; background: rgba(18, 21, 36, 0.78);
            }
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card .server-line--title,
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card .server-line--region,
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card .server-line--players,
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card .server-line--map {
                flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0;
            }
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card .server-line--title {
                font-weight: 600; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card .server-map-thumb {
                width: 40px; height: 28px; border-radius: 6px; overflow: hidden; flex-shrink: 0;
            }
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card .server-map-thumb img {
                width: 100%; height: 100%; object-fit: cover;
            }
            ${SERVERS_CONTAINER_SELECTOR}.${LINE_VIEW_CLASS} .server-card .players-count {
                font-size: 14px; font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    function applySavedView() {
        const container = document.querySelector(SERVERS_CONTAINER_SELECTOR);
        if (!container) return;
        container.classList.toggle(LINE_VIEW_CLASS, localStorage.getItem(STORAGE_KEY) === "line");
    }

    function toggleView(event) {
        event.preventDefault();
        const container = document.querySelector(SERVERS_CONTAINER_SELECTOR);
        if (!container) return;
        const isLineView = container.classList.toggle(LINE_VIEW_CLASS);
        localStorage.setItem(STORAGE_KEY, isLineView ? "line" : "grid");
    }

    function addToggleButton() {
        const toolbar = document.querySelector(TOOLBAR_SELECTOR);
        if (!toolbar || toolbar.querySelector(`.${VIEW_TOGGLE_BTN_CLASS}`)) return;

        const btn = document.createElement('button');
        btn.textContent = 'Switch View';
        btn.className = VIEW_TOGGLE_BTN_CLASS;
        Object.assign(btn.style, {
            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)',
            color: '#fff', fontSize: '12px', textTransform: 'uppercase', marginLeft: '10px'
        });
        btn.addEventListener('click', toggleView);
        toolbar.appendChild(btn);
        console.log('[Userscript] Switch View button added.');
        applySavedView();
    }

    injectStyles();
    applySavedView();
    addToggleButton();

    const observer = new MutationObserver((mutations, obs) => {
        const serversContainer = document.querySelector(SERVERS_CONTAINER_SELECTOR);
        const toolbar = document.querySelector(TOOLBAR_SELECTOR);
        if (serversContainer && toolbar && !toolbar.querySelector(`.${VIEW_TOGGLE_BTN_CLASS}`)) {
            addToggleButton();
            obs.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
