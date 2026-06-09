# CS Userscripts Collection

A comprehensive collection of Tampermonkey userscripts designed to enhance your experience on [play-cs.com](https://game.play-cs.com/). These scripts provide quality-of-life improvements, UI enhancements, and powerful automation features.

---

## 📋 Quick Navigation

- [Installation Guide](#installation-guide)
- [Available Scripts](#available-scripts)
  - [UserConfig (Recommended for Beginners)](#1-userconfig)
  - [Server Manager](#2-server-manager)
  - [Crosshair Manager](#3-crosshair-manager)
  - [Show Money](#4-show-money)
  - [Player Filter](#5-player-filter)
- [General Setup Instructions](#general-setup-instructions)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Installation Guide

### Prerequisites

You need **Tampermonkey** (or a compatible userscript manager) installed on your browser:

- **Chrome / Edge / Brave**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Opera**: [Tampermonkey](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
- **Safari**: [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### Basic Installation Steps

1. **Install Tampermonkey** from the link above for your browser
2. Click the **Tampermonkey icon** in your browser toolbar
3. Select **"Create a new script..."** or **"+" button**
4. **Delete** any existing code in the editor
5. **Copy & paste** the script code (see scripts below)
6. **Save** with `Ctrl+S` or `Cmd+S`
7. Navigate to [play-cs.com](https://game.play-cs.com/) and test!

---

## 📦 Available Scripts

### 1. **UserConfig** ⭐ (Recommended)

**Purpose**: Automatically execute custom console commands when you join a server. Manage your config, keybinds, and settings through an in-game UI.

**Key Features:**
- ✅ Automatic command execution on server join
- ✅ Floating gear icon (⚙️) UI for managing commands
- ✅ Add, edit, enable/disable commands easily
- ✅ Pre-loaded with useful default commands
- ✅ Persistent storage across browser sessions
- ✅ Manual command re-run button

**Installation File**: `userscripts/UserConfig/v3.user.js`

**Getting Started:**
1. Install the script (`v3.user.js`)
2. Join a play-cs.com server
3. Click the **gear icon** (⚙️) in the top-right
4. Edit or add your commands
5. Click **"Save Configuration"**

**Default Commands Included:**
```
bind "MWHEELDOWN" "-duck"
bind "MWHEELUP" "+duck"
bind "f3" "say NOtt LIVE ⚪❌"
bind "f4" "say KNIVES 🔪🗡️"
cl_lw 1
cl_lc 1
cl_bob 0
```

**Documentation**: [UserConfig README](./userscripts/UserConfig/README.md)

---

### 2. **Server Manager**

**Purpose**: Manage your Play-CS.com servers efficiently with map selection, presets, PINs, and Discord integration.

**Key Features:**
- ✅ Smart map selection with search & favorites
- ✅ Customizable server presets (Public, 5v5, DM, etc.)
- ✅ Automatic PIN generation for 5v5 presets
- ✅ Collapsible sections for cleaner UI
- ✅ Discord webhook integration (share server details)
- ✅ Auto-fix malformed server join links

**Installation File**: `userscripts/ServerManager/v3/v3.user.js`

**Key Advantages:**
- Saves time when managing multiple servers
- One-click preset application
- Discord integration for team coordination

**Documentation**: [Server Manager README](./userscripts/ServerManager/README.md)

---

### 3. **Crosshair Manager**

**Purpose**: Create and customize a persistent, static crosshair with full editor controls and profile saving.

**Key Features:**
- ✅ Advanced crosshair editor with sliders & color pickers
- ✅ Save multiple crosshair profiles
- ✅ Adjust length, thickness, gap, color, opacity
- ✅ Shadow & border effects for visibility
- ✅ In-game control panel at bottom-left
- ✅ Auto pointer-lock management

**Installation File**: `userscripts/crosshair/crosshair-manager.user.js`

**Use Cases:**
- Different crosshairs for different play styles
- Fine-tune appearance to your preference
- Quick profile switching in-game

**Documentation**: [Crosshair Manager README](./userscripts/crosshair/README.md)

---

### 4. **Show Money**

**Purpose**: Quickly announce your current money and primary weapon to team chat with a single keypress.

**Key Features:**
- ✅ Press **`L`** key to send status
- ✅ Automatically reads your money & weapon from HUD
- ✅ Sends to team chat only (teammates only)
- ✅ Disabled in spectator mode (no accidental spam)

**Installation File**: `userscripts/ShowMoney/show-money.user.js`

**When to Use:**
- Buy rounds: Let team know your economy
- Weapon rounds: Announce your primary weapon
- Quick communication without typing

**Documentation**: [Show Money README](./userscripts/ShowMoney/README.md)

---

### 5. **Player Filter**

**Purpose**: Filter and manage player lists on the server.

**Installation File**: `userscripts/player-filter.user.js`

**Documentation**: Individual script in root

---

## 🔧 General Setup Instructions

### Installation Order (Recommended)

1. **Start with UserConfig** (handles your main console commands/settings)
2. **Add Server Manager** (if you manage multiple servers)
3. **Add Crosshair Manager** (for crosshair customization)
4. **Add Show Money** (for quick team communication)
5. **Add Player Filter** (as needed)

### Verification

After installing each script:
1. Navigate to [play-cs.com](https://game.play-cs.com/)
2. Join a server or open server manager
3. Look for script indicators:
   - UserConfig: **Gear icon** (⚙️) in top-right
   - Server Manager: Enhanced UI with new buttons
   - Crosshair Manager: Panel in bottom-left
   - Show Money: Test by pressing **`L`** (if in game)

### Managing Scripts

- **Disable a script**: Click Tampermonkey icon → Uncheck the script
- **Edit a script**: Click Tampermonkey icon → Click script name → Edit
- **Remove a script**: Click Tampermonkey icon → Click script name → Delete

---

## 🐛 Troubleshooting

### Script Not Working

**Check these in order:**

1. **Is Tampermonkey enabled?**
   - Click the Tampermonkey icon (should be green/blue)
   - Check that the script is enabled (checkmark visible)

2. **Are you on the right site?**
   - Make sure you're on [play-cs.com](https://game.play-cs.com/) (not another site)
   - Some scripts only work in servers, others on the home page

3. **Check browser console for errors**
   - Press `F12` to open Developer Tools
   - Click **Console** tab
   - Look for red error messages
   - Screenshot & share if stuck

4. **Clear cache & reload**
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to hard-reload
   - This forces a fresh script load

5. **Verify script installation**
   - Click Tampermonkey icon
   - You should see the script listed with a checkmark
   - If missing, re-install from the files above

### Common Issues

| Issue | Solution |
|-------|----------|
| Gear icon not visible | Make sure you installed UserConfig. Join a server, wait for UI to load. |
| Commands not executing | Check that "Save Configuration" was clicked. Ensure you're in an actual server. |
| Crosshair not visible | Make sure Crosshair Manager is enabled. Check the control panel at bottom-left. |
| Server Manager buttons missing | Refresh the page. Check that the script is enabled in Tampermonkey. |

### Getting Help

1. Check the **individual script READMEs** in `userscripts/[ScriptName]/README.md`
2. Look at **discord posts** in each script folder for detailed explanations
3. Open **browser console** (`F12` → Console) for error messages

---

## 📁 Folder Structure

```
userscripts/
├── UserConfig/              # 🌟 Start here - config/commands
│   ├── v3.user.js          # ← INSTALL THIS
│   ├── README.md           # Full documentation
│   └── ...
├── ServerManager/           # Server management & Discord integration
│   ├── v3/
│   │   ├── v3.user.js      # ← Latest version
│   │   └── README.md
│   └── ...
├── Crosshair/              # Custom crosshair editor
│   ├── crosshair-manager.user.js  # ← INSTALL THIS
│   ├── README.md
│   └── ...
├── ShowMoney/              # Quick team announcements
│   ├── show-money.user.js  # ← INSTALL THIS
│   ├── README.md
│   └── ...
└── player-filter.user.js   # Player filtering
```

---

## ✨ Tips & Tricks

### Pro Tip 1: Bind All Scripts to Hotkeys

Use UserConfig to create hotkeys for quick access:

```
bind "alt+shift+x" "togglecrosshair"  // Toggle crosshair visibility
bind "l" "say $money"                  // Show money (via Show Money script)
```

### Pro Tip 2: Export Your Config

In UserConfig, use the Discord thread post feature to backup your commands:
- Open UserConfig menu (⚙️)
- Copy your command list
- Save it somewhere safe

### Pro Tip 3: Discord Webhook Setup

To use Server Manager's Discord integration:
1. Create a Discord server/channel
2. Get webhook URL (Server Settings → Webhooks → Create)
3. Paste in Server Manager's Discord field
4. Click "Share All to Discord" to auto-post server info

---

## 📝 License & Credits

These scripts are maintained and improved by the play-cs.com community. Original creators are credited in individual script READMEs.

- **UserConfig v3**: Created by `tiger3homs` (obbe.00)
- **Server Manager**: Community maintained
- **Crosshair Manager**: Community maintained
- **Show Money**: Adapted from Chrome extension
- **Player Filter**: Community script

---

## 🎮 Ready to Play?

1. **Install Tampermonkey** (if not already done)
2. **Start with UserConfig** (`v3.user.js`)
3. **Join a play-cs.com server** and test the gear icon
4. **Add more scripts** as needed
5. **Have fun!** 🚀

**Questions?** Check the individual script READMEs or the Discord thread posts in each folder.

---

**Last Updated**: June 2024 | Play-CS Userscripts Collection
