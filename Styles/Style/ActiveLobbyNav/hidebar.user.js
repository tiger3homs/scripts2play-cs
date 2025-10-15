// ==UserScript==
// @name         Hideable Sidebar, Fullscreen Tab Container & Tab Pane
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Adds a button to hide and show the sidebar, and expands the tab container and tab pane when hidden.
// @author       You
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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
                    // Or for truly minimal padding:
                    // tabPane.style.padding = '20px 20px 20px 20px'; // Example
                }
            }
        });

        // Append the button to the body
        document.body.appendChild(toggleButton);

        // Optional: Initial state - if you want the sidebar hidden by default on load
        /*
        sidebar.style.display = 'none';
        if (tabContainer) {
            tabContainer.style.marginLeft = '0px';
            tabContainer.style.width = '100%';
        }
        if (tabPane) {
            tabPane.style.padding = '159px 20px 0px 20px'; // Adjust padding for initial hidden state
        }
        */
    }

    // Run the function when the DOM is fully loaded
    window.addEventListener('load', addToggleButton);

})();