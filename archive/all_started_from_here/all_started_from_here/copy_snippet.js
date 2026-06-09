
(function() {
    const commands = [
        ['bind "f1" "say is it live? 🎥❓"', true],
        ['bind "f2" "say LIVE 🔴✨"', true],
        ['bind "f3" "say NOT LIVE ⚪❌"', true],
        ['bind "f4" "say KNIVES 🔪🗡️"', true],

        ['bind "f5" "deagle"', true],
        ['bind "f8" "flash;flash;sgren;"', true],






            ["cl_lw 1", true],
            ["cl_lc 1", true],

    ];

    let executed = false;

    function poll$() {
        const timer = document.querySelector('.hud-timer-text');
        if (timer && timer.innerHTML !== '0:00' && !executed) {
            const form = document.querySelector('.hud-message-input form');
            const inputField = document.querySelector('.hud-message-input input');
            if (form && inputField) {
                commands.forEach(([cmd, enabled]) => {
                    if (enabled) {
                        inputField.value = `;${cmd}`;
                        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    }
                });
                executed = true; 
            }
        }

        if (timer && timer.innerHTML === '0:00') {
            executed = false;
        }

        setTimeout(poll$, 500); 
    }

    poll$();
})();
