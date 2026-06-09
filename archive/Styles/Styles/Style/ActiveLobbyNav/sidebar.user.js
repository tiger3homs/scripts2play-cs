// ==UserScript==
// @name         Play-CS Sidebar
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Combines ActiveLobbyNav, Hidebar, and Player Stats on Server Card functionalities for Play-CS.com
// @author       tiger3homs aka (obbe.00 on discord)
// @match        https://play-cs.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Code from ActiveLobbyNav.user.js ---
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

    const setupActiveNavObserver = () => {
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
    };


    // --- Code from hidebar.user.js ---
    function addToggleButton() {
        const sidebar = document.querySelector('.lobby2-sidebar');
        const tabContainer = document.querySelector('.tab-container');
        const tabPane = document.querySelector('.tab-content .tab-pane'); // Get the tab pane

        if (!sidebar) {
            console.log('Sidebar not found.');
            return;
        }

        // Store original styles for sidebar, tabContainer, and tabPane
        const originalSidebarDisplay = sidebar.style.display;

        const originalTabContainerMarginLeft = tabContainer ? tabContainer.style.marginLeft : '';
        const originalTabContainerWidth = tabContainer ? tabContainer.style.width : '';

        const originalTabPanePadding = tabPane ? tabPane.style.padding : ''; // Store original padding

        // Create the button element
        const toggleButton = document.createElement('button');
        toggleButton.innerText = '☰'; // Hamburger icon
        toggleButton.style.position = 'fixed';
        toggleButton.style.top = '10px';
        toggleButton.style.left = '10px';
        toggleButton.style.zIndex = '10000'; // Ensure it's on top
        toggleButton.style.backgroundColor = 'rgba(14,16,36,0.92)';
        toggleButton.style.color = 'white';
        toggleButton.style.border = '1px solid rgba(255,255,255,0.08)';
        toggleButton.style.borderRadius = '5px';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.fontSize = '20px';
        toggleButton.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.3)';

        // Add click event listener
        toggleButton.addEventListener('click', () => {
            if (sidebar.style.display === 'none') {
                // Showing sidebar
                sidebar.style.display = originalSidebarDisplay; // Revert to original display
                toggleButton.style.left = '10px'; // Move button back

                // Revert tab container styles
                if (tabContainer) {
                    tabContainer.style.marginLeft = originalTabContainerMarginLeft || '301px';
                    tabContainer.style.width = originalTabContainerWidth || '100%';
                }

                // Revert tab pane styles
                if (tabPane) {
                    tabPane.style.padding = originalTabPanePadding || '159px 315px 0px 0px'; // Revert or set default
                }

            } else {
                // Hiding sidebar
                sidebar.style.display = 'none';
                toggleButton.style.left = '10px'; // Keep button visible on the left

                // Expand tab container
                if (tabContainer) {
                    tabContainer.style.marginLeft = '0px'; // Remove left margin
                    tabContainer.style.width = '100%';    // Make it full width
                }

                // Adjust tab pane padding for full screen
                if (tabPane) {
                    // You might want to remove all horizontal padding or adjust as needed
                    tabPane.style.padding = '159px 20px 0px 20px'; // Example: retain top/bottom padding, reduce side padding
                }
            }
        });

        // Append the button to the body
        document.body.appendChild(toggleButton);
    }

    // --- Refactored code to add player info to server card ---

    async function getPlayerId() {
        const cachedPlayerId = localStorage.getItem('playcs_playerId');
        if (cachedPlayerId) {
            return cachedPlayerId;
        }

        // Try to find the player ID on the current page
        const profileLink = document.querySelector('a[href*="/user/"]');
        if (profileLink) {
            const match = profileLink.href.match(/\/user\/(\d+)/);
            if (match && match[1]) {
                const playerId = match[1];
                localStorage.setItem('playcs_playerId', playerId);
                return playerId;
            }
        }

        // Fallback to fetching the profile page
        try {
            const response = await fetch('https://play-cs.com/en/profile');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const ths = Array.from(doc.querySelectorAll('th'));
            const playerIdTh = ths.find(th => th.innerText.trim() === 'Player ID');
            if (playerIdTh) {
                const playerId = playerIdTh.nextElementSibling.innerText.trim().replace('#', '');
                localStorage.setItem('playcs_playerId', playerId);
                return playerId;
            }
            throw new Error('Player ID not found on profile page.');
        } catch (error) {
            console.error('Error fetching Player ID:', error);
            return null;
        }
    }

    async function getPlayerStats(playerId) {
        if (!playerId) return null;
        try {
            const response = await fetch(`https://play-cs.com/rating/search/${playerId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const playerNameElement = doc.querySelector('.player_name');
            const usernameWithFlag = playerNameElement ? playerNameElement.innerHTML : 'Username not found';

            const tds = Array.from(doc.querySelectorAll('td'));
            const skillTd = tds.find(td => td.innerText.includes('Skill:'));
            let skill = 'Skill not found';
            if (skillTd) {
                const skillMatch = skillTd.innerText.match(/Skill:\s*([\d.]+)/);
                if (skillMatch && skillMatch[1]) {
                    skill = skillMatch[1];
                } else {
                    const clanMatch = skillTd.innerText.match(/Clan:\s*\w+\s*([\d.]+)/);
                    if (clanMatch && clanMatch[1]) {
                        skill = clanMatch[1];
                    }
                }
            }

            return { usernameWithFlag, skill };
        } catch (error) {
            console.error('Error fetching player stats:', error);
            return null;
        }
    }

    function updateServerCard(playerId, stats) {
        if (!stats) return;
        const serverCard = document.querySelector('.lobby3-server-card');
        if (serverCard) {
            const playerInfoDiv = document.createElement('div');
            playerInfoDiv.style.marginTop = '10px';
            playerInfoDiv.innerHTML = `
                <span class="main-info-middle-userdata__mmr">
                    <a href="/rating/search/${playerId}" style="color: #91ff08;">
                    ${stats.usernameWithFlag} Skill: ${stats.skill}
                    </a>
                </span>
            `;
            serverCard.appendChild(playerInfoDiv);
        } else {
            console.log('Server card not found for displaying player info.');
        }
    }

    async function addPlayerInfoToServerCard() {
        const playerId = await getPlayerId();
        if (playerId) {
            const stats = await getPlayerStats(playerId);
            updateServerCard(playerId, stats);
        }
    }

    // --- Run both scripts on page load ---
    function initializeScripts() {
        setupActiveNavObserver();
        addToggleButton();
        addPlayerInfoToServerCard();
    }

    // Run the function when the DOM is fully loaded
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initializeScripts);
    } else {
        initializeScripts();
    }

})();
