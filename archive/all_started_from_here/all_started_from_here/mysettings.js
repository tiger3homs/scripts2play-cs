(function() {
    // Define your forced settings
    const forcedSettings = {
        name: 'MyPlayer',
        gamma: "5",
        volume: "0.2",
        sensitivity: "1.49",
        sensivity: "3",
        cl_crosshair_size: "small",
        cl_crosshair_color: "0 0 0",
        cl_crosshair_translucent: 1,
        wheel_jump_everywhere: 1,
        net_optimization: 1,
        minmodels: 1,
        cl_minmodels: "1",
        mp_decals: 0,
        _cl_autowepswitch: 0,
        hud_centerid: 1,
        stretch_canvas: 1,
        fps_max: "150",
        cl_bobcycle: "0.8",
        cl_dynamiccrosshair: 0,
        inverted_mouse: 0,
        zoom_sensitivity_ratio: "1.2"
        // add other keys from the saved object if you want to override more
    };

    // This depends on how the site handles saving
    // Usually there's a function like `saveSettings(obj)` — we can call it
    if (typeof saveSettings === 'function') {
        saveSettings(forcedSettings);
        console.log("Forced settings applied via saveSettings()");
    } else {
        console.log("Cannot find saveSettings(), forcing manually on inputs...");

        // Fallback: force all input elements
        for (const key in forcedSettings) {
            const el = document.querySelector(`[name="${key}"]`);
            if (!el) continue;

            const value = forcedSettings[key];
            if (el.type === 'checkbox') {
                el.checked = !!value;
            } else {
                el.value = value;
            }

            // Update display spans if exist
            const span = document.getElementById(`${key}-show`);
            if (span) {
                span.textContent = el.type === 'range' ? el.value : value;
            }
        }
    }
})();
