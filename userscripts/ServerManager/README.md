# Server Manager  (Maps, Presets, PINs & UI)

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/aba1d350-f9ab-4461-94f5-9dd20b754167" />


## Table of Contents
- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Discord Integration](#discord-integration)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

## About
This is a Tampermonkey userscript designed to significantly enhance the server management experience on Play-CS.com. It streamlines common tasks, provides better UI organization, and introduces powerful features like server presets, smart map selection, and Discord integration for sharing server details.

The script aims to make managing your Play-CS.com servers more efficient and user-friendly, especially for those who frequently switch configurations or manage multiple servers.

## Features
- **Smart Map Selection:**
    - Quick-select buttons for your favorite maps.
    - An intelligent search bar to filter and find maps easily.
    - 
- **Customizable Server Presets:**
    - Apply predefined configurations (e.g., Public, 5vs5, Deathmatch) to all your servers with a single click.
    - Automatically generates a random PIN for 5vs5 presets.
- **Collapsible Sections:**
    - Makes the "New server" and "Specifications" sections collapsible to reduce clutter.
- **UI Cleanup:**
    - Hides unnecessary UI elements like chat buttons and lobby headers.
    - Adjusts padding for a cleaner layout.
- **Improved Server Links:**
    - Automatically fixes malformed server join links (e.g., those missing `https:` or having extra `://`).
    - Ensures links are corrected after saving server settings.
- **Discord Integration:**
    - Configure your own Discord webhook URL directly within the Play-CS.com interface.
    - A dedicated "Share All to Discord" button to send formatted details of all your servers (map, link, PIN) to a specified Discord channel.

## Installation

This script requires a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) (recommended for Chrome, Edge, Firefox) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (for Firefox).

1.  **Install Tampermonkey (or Greasemonkey):**
    *   Go to your browser's extension store and search for "Tampermonkey" (or "Greasemonkey" for Firefox).
    *   Install the extension.
2.  **Install the Userscript:**
    *   Click on the Tampermonkey icon in your browser toolbar.
    *   Select "Create a new script..." or "Dashboard" -> "Utilities" -> "Import from URL".
    *   Copy the entire script content from the source file (`.user.js` or the code block above).
    *   Paste the content into the editor and save it (Ctrl+S or File > Save).
    *   Alternatively, visit the raw script URL if provided, and Tampermonkey should prompt you to install it.

## Usage

Once installed and enabled, the script will automatically activate when you visit `https://play-cs.com/en/myservers`.

-   **Map Selection:** Navigate to any of your server rows. You'll see new buttons for favorite maps and a search input next to the map dropdown.
-   **Mode Presets:** Look for a new "Mode Presets" section, usually above your server list, with buttons like "Public", "5vs5", and "Deathmatch". Click one to apply.
-   **Collapsible Sections:** The "New server" and "Specifications" headers will now be clickable to expand/collapse their content.
-   **Discord Webhook Configuration:** A new section titled "Discord Webhook Configuration" will appear at the top of the server management page. Enter your webhook URL here and click "Save Webhook".
-   **Share to Discord:** A "Share All to Discord" button will appear next to the main "Save" button on the page.

## Configuration

The script includes a `CONFIG` object at the top of the file that you can modify directly within your Tampermonkey editor to customize certain aspects:

```javascript
const CONFIG = {
  favoriteMaps: ['de_mirage', 'de_nuke', 'de_tuscan', 'de_dust2', 'de_inferno', 'de_train',], // Add or remove maps here
  collapsibleHeaders: ['New server', 'Specifications'], // Headers to make collapsible
  // ... other selectors
  serverPresets: {
    public: { /* ... settings ... */ },
    '5vs5': { /* ... settings ... */ },
    deathmatch: { /* ... settings ... */ }
  }
};
```

-   **`favoriteMaps`**: An array of map names (`string`) that will appear as quick-select buttons. Edit this to include your most used maps.
-   **`collapsibleHeaders`**: An array of `string` values representing the `<h3>` header texts you want to make collapsible.
-   **`serverPresets`**: This object defines the various server modes. You can
    -   Add new presets (e.g., `funmode: { ... }`)
    -   Modify `checkboxes` (boolean true/false) and `dropdowns` (string value) for existing presets.
    -   **Important**: If adding a new preset, ensure the `isPublic` property is set (`true` or `false`).
    -   The `5vs5` preset automatically generates a random PIN when applied.

## Discord Integration

1.  **Create a Discord Webhook:**
    *   In your Discord server, go to "Server Settings" -> "Integrations".
    *   Click "Create Webhook".
    *   Give it a name (e.g., "Play-CS Manager"), choose a channel, and copy the "Webhook URL".
    *   <img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/e232865a-bc1f-4412-b9eb-f7ccb59e86ef" />
2.  **Configure in Play-CS.com:**
    *   Paste the copied Webhook URL into the "Webhook URL" input field in the "Discord Webhook Configuration" section on the Play-CS.com server management page.
    *   Click "Save Webhook". The status will update to "Webhook Active".
3.  **Share Server Details:**
    *   Click the "Share to Discord 🚀" button. A message containing the map, link, and PIN for your server will be sent to the configured Discord channel.

## Contributing

Feel free to suggest improvements, report bugs, or submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

-   **Author:** tiger3homs (aka obbe.00 on Discord)
```
