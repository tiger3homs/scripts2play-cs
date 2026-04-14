CS Crosshair - Manager
A highly customizable userscript for adding a custom crosshair to play-cs.com.
This script provides a persistent, static crosshair with a full-featured editor, allowing you to fine-tune its appearance to your liking. It also includes a profile system, so you can save and switch between different crosshair designs effortlessly.

<img width="529" height="799" alt="image" src="https://github.com/user-attachments/assets/8c0eebb8-77ec-42de-bc0f-d9a3d9732752" />


🚀 Features
Editor with Sliders and Color Pickers: Easily adjust the crosshair's length, thickness, gap, color, and opacity.

Profiles System: Save your favorite crosshair configurations to different profiles. You can create, load, rename, and delete profiles, allowing for quick changes between different play styles or preferences.

Advanced Effects: Add a shadow for increased visibility against bright backgrounds and a border (outline) for a sharp, clean look.

In-Game Control: A small, non-intrusive UI panel appears at the bottom-left of the screen for quick access to the main editor and crosshair toggles.

Pointer Lock Integration: The script intelligently manages the game's PointerLock, automatically exiting it when you open the UI menu to allow for mouse interaction, and re-engaging it when you close the menu.

Persistence: Your settings and profiles are saved locally in your browser, so they'll be there the next time you visit the site.

🕹️ How to Use
Install Tampermonkey: Make sure you have the Tampermonkey browser extension installed.

Install the Script: Copy the entire code from this file and create a new script in your Tampermonkey dashboard.

Navigate to the Game: Go to https://game.play-cs.com/.

Activate the UI: Press <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> to toggle the UI panel in the bottom-left corner.

Access the Editor: From the UI panel, click "Show Menu" to open the main configuration editor.

Customize and Save: Adjust the sliders and color pickers to create your perfect crosshair. Use the profile manager to save your new design.

Exit the Editor: Press <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> again to close the UI panel and re-enable PointerLock, or click "Hide Menu" and then the "Crosshair ON" button.

🛠️ Settings & Controls
Main Editor Controls
Length: Adjusts the length of each crosshair line segment.

Thickness: Sets the width of the crosshair lines.

Gap: Controls the distance between the center of the screen and the start of each crosshair line.

Color: Changes the main color of the crosshair.

Opacity: Controls the transparency of the crosshair.

Effects
Shadow: Toggle a drop shadow and adjust its color, blur, and offset (X and Y coordinates).

Border: Toggle a border around the crosshair lines and adjust its color and thickness.

Profile Manager
Current Profile: A dropdown menu to switch between your saved crosshair profiles.

Save New: Create a new profile with your current settings.

Rename: Change the name of the currently selected profile.

Delete: Delete a profile. (Note: The "Default" profile cannot be deleted or renamed.)

📝 Troubleshooting
Script isn't working: Make sure you're on https://game.play-cs.com/* and that the script is enabled in your Tampermonkey dashboard.

Settings don't save: Ensure your browser is not in "Private" or "Incognito" mode, as this can prevent local storage from working correctly.

UI is hidden: Remember the keybind is <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>.

👥 Credits
Original Author: Tiger3homs (on Discord as obbe.00)

Refactored by: AI Assistant
