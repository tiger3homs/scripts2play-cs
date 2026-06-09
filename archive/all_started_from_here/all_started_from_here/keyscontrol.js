// Define the key bindings you want to force
const keyBindings = {
    buyammo1: ",",       // Buy Ammo 1
    buyammo2: ".",       // Buy Ammo 2
    buyequip: "O",       // Buy Equip
    radioa: "Z",         // Radio Commands
    radiob: "X",         // Group Radio
    radioc: "V"          // Radio Responses
};

// Iterate over each key binding and set the <select> value
for (const [name, key] of Object.entries(keyBindings)) {
    const select = document.querySelector(`select[name="${name}"]`);
    if (select) {
        select.value = key;

        // Trigger change event so any event listeners react to the new value
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

console.log("Key bindings have been forced!");
