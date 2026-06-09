// ==UserScript==
// @name         Highlight Active Lobby Nav Item
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Highlights the active page in the lobby navigation menu.
// @author       tiger3homs aka (obbe.00 on discord)
// @match        https://play-cs.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const normalizePath = (path) => {
        if (!path) return '';
        let normalized = path.split('?')[0].split('#')[0];
        if (!normalized.startsWith('/')) normalized = '/' + normalized;
        if (normalized.length > 1 && normalized.endsWith('/')) normalized = normalized.slice(0, -1);
        return normalized.toLowerCase();
    };

    const applyActiveClass = () => {
        const navItems = document.querySelectorAll('.lobby3-side-nav__item');
        if (navItems.length === 0) return;

        const currentPathname = normalizePath(window.location.pathname);
        let activeItemFound = false;

        navItems.forEach(item => {
            const linkHref = item.getAttribute('href');
            if (!linkHref) return;

            let normalizedLinkHref;
            if (linkHref.startsWith('http://') || linkHref.startsWith('https://')) {
                try {
                    const urlObj = new URL(linkHref);
                    normalizedLinkHref = normalizePath(urlObj.pathname);
                    if (urlObj.hostname !== window.location.hostname) return;
                } catch (e) {
                    normalizedLinkHref = normalizePath(linkHref);
                }
            } else {
                normalizedLinkHref = normalizePath(linkHref);
            }

            let currentPathWithoutLang = currentPathname;
            if (currentPathname.length > 3 && currentPathname.startsWith('/') && currentPathname[3] === '/') {
                currentPathWithoutLang = normalizePath(currentPathname.substring(3));
            }

            const isMatch = (
                currentPathname === normalizedLinkHref ||
                currentPathWithoutLang === normalizedLinkHref
            );

            item.classList.toggle('lobby3-side-nav__item--active', isMatch);
            if (isMatch) activeItemFound = true;
        });
    };

    applyActiveClass();

    const observer = new MutationObserver((mutationsList, observer) => {
        let navContentChanged = false;
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && (node.matches('.lobby3-side-nav') || node.querySelector('.lobby3-side-nav__item'))) {
                        navContentChanged = true;
                        break;
                    }
                }
            }
            if (navContentChanged) break;
        }

        if (navContentChanged || document.querySelector('.lobby3-side-nav__item')) {
            clearTimeout(window._tampermonkeyActiveNavTimeout);
            window._tampermonkeyActiveNavTimeout = setTimeout(applyActiveClass, 50);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('popstate', applyActiveClass);
    window.addEventListener('hashchange', applyActiveClass);
    window.addEventListener('DOMContentLoaded', applyActiveClass);
})();
