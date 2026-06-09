// CS 1.6 Crosshair - Chrome DevTools Snippet
// Run this in Chrome DevTools Snippets (F12 → Sources → Snippets)

(function() {
    // Remove existing crosshair if present
    const existing = document.querySelector('.hud-crosshair');
    if (existing) {
        existing.remove();
    }
    
    // Remove existing styles
    const existingStyle = document.querySelector('#crosshair-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Add CSS styles
    const style = document.createElement('style');
    style.id = 'crosshair-style';
    style.textContent = `/* CS 1.6 Crosshair Generator - Generated CSS */
.hud-crosshair {
    visibility: visible;
    position: fixed;
    width: 12px;
    height: 12px;
    left: 50%;
    top: 50%;
    margin-left: -6px;
    margin-top: -6px;
    z-index: 12;
    opacity: 0.9;
    filter: drop-shadow(0 0 2px #000000);
}

.hud-crosshair div {
    background: #00FFFF;
    position: absolute;
}

.hud-crosshair-1, .hud-crosshair-2 {
    width: 2px;
    height: 3px;
    left: 5px;
}

.hud-crosshair-3, .hud-crosshair-4 {
    width: 3px;
    height: 2px;
    top: 5px;
}

.hud-crosshair-1 { top: 0px; }
.hud-crosshair-2 { top: 9px; }
.hud-crosshair-3 { left: 0px; }
.hud-crosshair-4 { left: 9px; }`;
    document.head.appendChild(style);
    
    // Add HTML structure
    const crosshair = document.createElement('div');
    crosshair.innerHTML = `<div class="hud-crosshair">
    <div class="hud-crosshair-1"></div>
    <div class="hud-crosshair-2"></div>
    <div class="hud-crosshair-3"></div>
    <div class="hud-crosshair-4"></div>
</div>`;
    document.body.appendChild(crosshair.firstElementChild);
    
    console.log('✅ CS 1.6 Crosshair activated!');
    console.log('To remove: document.querySelector(".hud-crosshair").remove()');
})()
