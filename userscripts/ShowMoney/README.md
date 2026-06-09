# CS Game Status Announcer

A Tampermonkey user script for the browser game `www.play-cs.com`. This script allows players to quickly and easily announce their current in-game money and primary weapon to their team chat with a single keypress.

## Original Source

This script is a direct conversion and adaptation of the functionality from the Chrome extension **"ShowMoney"** created by [mrquaketotheworld](https://github.com/mrquaketotheworld).

The original source code for the extension can be found here:
*   **https://github.com/mrquaketotheworld/ShowMoney**

## Features

*   **One-Key Status Update**: Press the `L` key to instantly send your status.
*   **Automatic Information**: The script automatically reads your current money and detects your primary weapon from the game's HUD.
*   **Team Communication**: The message is sent directly to the team chat (`messagemode2`), ensuring only your teammates see the information.
*   **Spectator Safe**: The script is automatically disabled while you are in spectator mode to prevent accidental messages.

## Installation

To use this script, you first need a user script manager extension for your browser. [Tampermonkey](https://www.tampermonkey.net/) is the most popular choice.

1.  **Install Tampermonkey**:
    *   [Tampermonkey for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    *   [Tampermonkey for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    *   [Tampermonkey for Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
    *   [Tampermonkey for Safari](https://apps.apple.com/us/app/tampermonkey/id1482490089)

2.  **Install the Script**:
    *   Navigate to the script file in this repository (`show-money.user.js`).
    *   Click the **"Raw"** button at the top right of the file viewer.
    *   Tampermonkey will automatically open a new tab and ask you to confirm the installation.
    *   Click **"Install"**.

The script is now installed and will automatically run when you are on `https://game.play-cs.com/`.

## How to Use

1.  Join a game on `https://game.play-cs.com/`.
2.  During a round (when you are not a spectator), simply press the **`L`** key on your keyboard.
3.  Your status will be automatically typed and sent to the team chat.

**Example message:** `$ 4750 + AK-47`
