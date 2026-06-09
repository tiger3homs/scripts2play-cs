# Server List Grid ↔ Line Toggle

A Tampermonkey userscript for play-cs.com that allows you to toggle the server list display between a compact line view and the default card grid view. Your preference is saved locally, so your chosen view mode persists across page reloads.

<img width="960" height="540" alt="image" src="https://github.com/user-attachments/assets/3b9af352-bbfe-48a6-b756-d50e30bb16fa" />

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4dd42394-bd61-42cf-aa46-29969aea28dc" />


## Features

*   **Toggle View:** A new button in the server list toolbar allows you to switch between grid and line view.
*   **Persistent Preference:** Your last chosen view mode (grid or line) is saved in your browser's `localStorage` and automatically applied when you revisit the page.
*   **Optimized Performance:** The script is designed for efficiency, injecting CSS once and using a MutationObserver to ensure the toggle button is added reliably as the page content loads, without unnecessary resource usage.

## Installation

1.  **Install Tampermonkey:** If you don't already have it, install the Tampermonkey browser extension for your browser (Chrome, Firefox, Edge, etc.).
    *   [Tampermonkey for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    *   [Tampermonkey for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    *   Or search for "Tampermonkey" in your browser's extension store.
2.  **Create a New Userscript:**
    *   Click on the Tampermonkey icon in your browser's toolbar.
    *   Select "Create a new script...".
3.  **Paste the Code:** Delete any existing code in the new script editor and paste the entire content of `server-list-toggle.js` (provided below) into it.
4.  **Save:** Save the script (usually by clicking File -> Save or pressing Ctrl+S / Cmd+S).

## How to Use

1.  Navigate to [play-cs.com](https://play-cs.com/).
2.  Look for a new "Switch View" button in the server list's toolbar (usually near the filter/sort options).
3.  Click the "Switch View" button to toggle between the compact line list and the larger card grid display.
4.  Your chosen view will be saved and automatically applied on subsequent visits to the site.

## Troubleshooting

*   **Button not appearing?** Ensure Tampermonkey is enabled for `play-cs.com` and the script is active. Sometimes, dynamic page loading can be tricky; try refreshing the page.
*   **View not changing?** Check for any browser extensions that might conflict with JavaScript or CSS modifications.
*   **Still having issues?** Open your browser's developer console (F12) and check for any error messages.

## License

This script is provided as-is, without any specific license. Feel free to use and modify it for personal use.
```
