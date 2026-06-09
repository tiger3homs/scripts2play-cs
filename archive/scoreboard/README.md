# Scoreboard to Discord (Embed) - Player Tracking & UI

This Tampermonkey userscript enhances the Play-CS.com gaming experience by providing advanced scoreboard functionality, real-time player tracking, and seamless integration with Discord webhooks. It allows users to capture current match scoreboards with accumulated player statistics and send them directly to a Discord channel as a beautifully formatted embed.

## ✨ Features

*   **Discord Webhook Integration:** Send detailed scoreboard information directly to a Discord channel.
*   **Rich Embeds:** Scoreboards are formatted as visually appealing Discord embeds, including map name, scores, and player statistics.
*   **Player Tracking:** Accumulates player kills and deaths across game rounds.
*   **CORS Bypass:** Utilizes `GM_xmlhttpRequest` to bypass Cross-Origin Resource Sharing (CORS) restrictions, allowing direct communication with Discord webhooks.
*   **Intuitive UI for Webhook Management:** A simple modal interface (triggered by `Alt+Shift+D`) allows users to set, update, or clear their Discord webhook URL, which is saved persistently.
*   **Temporary Notifications:** Provides on-screen feedback for script actions (e.g., "Scoreboard sent!", "Webhook URL not set!").
*   **Clean Player Names:** Automatically removes common clan tags or prefixes from player names for cleaner presentation.
*   **Country Flags:** Attempts to include country flags (as emojis) for players based on scoreboard data.

## 🚀 Installation

1.  **Install Tampermonkey:** If you don't have it already, install the Tampermonkey browser extension for your browser:
    *   [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    *   [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    *   [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpbldmmepgdkmfapfmcctocadp)
    *   (and other browsers supporting extensions)
    
2.
   *   Navigate to the script file in this repository (`scoreboard.user.js`).
   *   Click the **"Raw"** button at the top right of the file viewer.
   *   Tampermonkey will automatically open a new tab and ask you to confirm the installation.
   *   Click **"Install"**.

The script should now be active when you visit `https://game.play-cs.com/*`.

## ⚙️ Configuration

Before using the script, you **must** set up your Discord Webhook URL.

1.  **Create a Discord Webhook:**
    *   In your Discord server, go to **Server Settings** -> **Integrations**.
    *   Click "Create Webhook" (or "View Webhooks" and then "New Webhook").
    *   Give it a name (e.g., "Play-CS Scoreboard"), choose a channel, and copy the **Webhook URL**.
2.  **Set Webhook in-game:**
    *   While on `https://game.play-cs.com/`, press `Alt + Shift + D`.
    *   A settings modal will appear.
    *   Paste your copied Discord Webhook URL into the input field.
    *   Click "Save".

Your webhook URL will be saved securely by Tampermonkey and persist across browser sessions.

## 🎮 Usage

Once the script is installed and the webhook is configured:

*   Navigate to `https://game.play-cs.com/`.
*   During a match, when you want to capture the scoreboard:
    *   Press `P` to send the scoreboard with a "First Half" footer.
    *   Press `K` to send the scoreboard with a "Second Half" footer.
*   To open the Webhook Settings UI:
    *   Press `Alt + Shift + D`.

Upon sending, you'll see a temporary notification in the top-right corner of your screen indicating success or failure.
