# CS UserConfig

## Overview

This is a Tampermonkey user script designed for the web-based shooter game at `www.play-cs.com`. It automates the process of entering a series of console commands at the beginning of each match. This saves you from having to manually type them every time, allowing you to quickly set up your preferred key bindings and game settings.

## Features

*   **Automated Command Execution**: Automatically runs a predefined set of commands when a match starts.
*   **One-Time Execution**: The script runs only once per match to avoid spamming the console.
*   **Fully Customizable**: You can easily edit the script to add, remove, or modify the commands to fit your personal play style.

## Source and Conversion

This script was converted from a Chrome Extension. The original source code can be found at the following GitHub repository:

*   **Source:** [https://github.com/mrquaketotheworld/UserConfig](https://github.com/mrquaketotheworld/UserConfig)

## Installation

To use this script, you must first have a user script manager installed in your browser. [Tampermonkey](https://www.tampermonkey.net/) is the recommended choice.

1.  **Install Tampermonkey**: If you don't already have it, install the Tampermonkey extension for your browser (available for Chrome, Firefox, Edge, Safari, and more).
2.  **Install the Script**:
    *   Open the Tampermonkey dashboard in your browser.
    *   Click on the **"Create a new script"** tab (usually marked with a `+` icon).
    *   Delete the default content in the editor.
    *   Copy the entire content of the user script and paste it into the editor.
    *   Go to **File > Save** to complete the installation.

## How It Works

The script monitors the game's interface for the match timer. Once the timer appears and is not at `0:00`, the script injects and submits each of the predefined commands into the in-game chat/console input field.

The `executed` flag ensures that this action is performed only once per page load.

## Customization

You can customize the commands by editing the `commands` array within the script.

```javascript
const commands = [
    // Add or remove commands here
    // Format: ['command', true],
    ['bind "MWHEELDOWN" "-duck"', true],
    ['bind "MWHEELUP" "+duck"', true],
    // ... more commands
];

To disable a command without deleting it, you can change true to false:

// This command is now disabled
['bind "f3" "say NOtt LIVE ⚪❌"', false],
