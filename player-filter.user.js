// ==UserScript==
// @name         Play-CS Player Filter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Filter players by server name on play-cs.com
// @author       You
// @match        https://play-cs.com/en/players-online
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Create the search input field
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Filter by server name...';
    searchInput.style.width = '100%';
    searchInput.style.padding = '10px';
    searchInput.style.marginBottom = '10px';
    searchInput.style.boxSizing = 'border-box';

    // Add the search input to the page
    const table = document.querySelector('.players-online-table');
    table.parentNode.insertBefore(searchInput, table);

    // Add event listener to the search input
    searchInput.addEventListener('keyup', () => {
        const filter = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll('.players-online-table-row');

        rows.forEach(row => {
            const serverName = row.cells[5].textContent.toLowerCase();
            if (serverName.includes(filter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
})();
