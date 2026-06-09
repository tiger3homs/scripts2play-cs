// ==UserScript==
// @name         Cyberpunk Dark Mode for Lobby Page
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Restyle lobby page with futuristic cyberpunk aesthetic
// @author       You
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        /* === Global Background === */
        body, .lobby2-bg {
            color: #e5e8ff !important;
            font-family: 'Roboto','Segoe UI',Arial,sans-serif !important;
        }

        /* === Sidebar Navigation === */
        .lobby2-sidebar, .lobby3-side-nav {
            background: rgba(14,16,36,0.92) !important;
            border-right: 1px solid rgba(255,255,255,0.08) !important;
            box-shadow: 6px 0 20px rgba(0,0,0,0.6) !important;
        }
        .lobby3-side-nav__item {
            color: #a7afd0 !important;
            padding: 10px 16px !important;
            border-radius: 10px !important;
            transition: background 0.25s ease, color 0.25s ease !important;
        }
        .lobby3-side-nav__item:hover {
            background: rgba(90,186,254,0.15) !important;
            color: #7fffd4 !important;
        }
        .lobby3-side-nav__item--active {
            background: linear-gradient(135deg, #755bff55, #42d8be55) !important;
            color: #fff !important;
            font-weight: bold !important;
        }
        .lobby3-side-nav__footer {
            border-top: 1px solid rgba(255,255,255,0.08) !important;
            padding-top: 10px !important;
        }

        /* === Top Navigation === */
        .lobby-nav, .dropdown2 {
            background: rgba(9,13,28,0.85) !important;
            border-bottom: 1px solid rgba(255,255,255,0.1) !important;
            backdrop-filter: blur(12px) !important;
        }
        .lobby-nav__link {
            color: #d9e0ff !important;
            padding: 8px 14px !important;
            border-radius: 6px !important;
            transition: background 0.25s ease, color 0.25s ease !important;
        }
        .lobby-nav__link:hover {
            background: rgba(90,186,254,0.2) !important;
            color: #61ffd7 !important;
        }
        .lobby-nav__link.is-active {
            background: linear-gradient(135deg, #5abafe, #755bff) !important;
            color: #fff !important;
        }

        /* === Cards === */
        .lobby3-server-card {
            background: rgba(9,13,28,0.72) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 14px !important;
            box-shadow: 0 10px 24px rgba(0,0,0,0.35), 0 0 8px #5abafe55 !important;
            margin: 12px !important;
            padding: 14px !important;
            backdrop-filter: blur(10px) !important;
        }
        .lobby3-server-card__header {
            color: #5abafe !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
        }
        .lobby3-server-card__meta-label {
            color: #a7afd0 !important;
        }
        .lobby3-server-card__meta-value {
            color: #61ffd7 !important;
            font-weight: 600 !important;
        }

        /* === Tabs & Content === */
        .tab-container, .tab-content, .lobby2-tab-header-block {
            background: rgba(14,16,36,0.75) !important;
            border-radius: 12px !important;
            padding: 12px !important;
        }

        /* === Tables === */
        .cvars-table {
            background: rgba(18,21,36,0.85) !important;
            border-radius: 10px !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .cvars-table td, .cvars-table th {
            padding: 10px !important;
            color: #e5e8ff !important;
        }
        .cvars-table tr:nth-child(even) {
            background: rgba(255,255,255,0.03) !important;
        }

        /* === Inputs === */
        input, .pin_code_input, .input_dark {
            background: rgba(18,21,36,0.72) !important;
            border: 1px solid rgba(255,255,255,0.15) !important;
            border-radius: 12px !important;
            padding: 6px 12px !important;
            color: #e5e8ff !important;
        }
        input:focus, .pin_code_input:focus, .input_dark:focus {
            border-color: #61ffd7 !important;
            box-shadow: 0 0 8px #61ffd755 !important;
            outline: none !important;
        }

        /* === Buttons === */
        .btn, .btn-default, .dropbtn, .save-btn, .save-btn2, .save-btn3 {
            background: linear-gradient(135deg, #5abafe, #755bff) !important;
            border: none !important;
            border-radius: 999px !important;
            color: #fff !important;
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
            padding: 8px 18px !important;
            transition: all 0.25s ease-in-out !important;
        }
        .btn:hover, .dropbtn:hover, .save-btn:hover, .save-btn2:hover, .save-btn3:hover {
            background: linear-gradient(135deg, #61ffd7, #42d8be) !important;
            box-shadow: 0 6px 18px rgba(0,255,200,0.35) !important;
            transform: translateY(-2px) !important;
        }
    `);
})();
