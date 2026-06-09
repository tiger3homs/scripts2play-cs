// ==UserScript==
// @name         CS Game Money and Weapon Status
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Press 'L' to announce your money and weapon in team chat on game.play-cs.com.
// @author       tiger3homs aka obbe.00 on discord
// @match        https://game.play-cs.com/*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const weapons = {
    b: 'AK-47',
    d: 'TMP',
    e: 'AUG',
    i: 'T Autosniper Rifle',
    k: 'Shotgun 1',
    l: 'MAC',
    m: 'P90',
    n: 'Scout',
    o: 'CT Autosniper Rifle',
    q: 'UMP',
    r: 'AWP',
    t: 'Famas',
    x: 'MP5',
    z: 'M249',
    A: 'SG-552',
    B: 'Shotgun 2',
    v: 'Galil',
    w: 'M4A1',
  };

  function initKeyListener() {
    $(document).on('keydown', (e) => {
      // Ignore if spectator HUD is shown
      if ($('.hud-spectator').length) return;

      // Key "L"
      if (e.keyCode === 76) {
        const money = $('.hud-money .hud-value').text().trim();
        const $input = $('.hud-message-input input');

        // Try to grab first weapon character
        const weaponChar = $('.hud-weapons .hud-weapon').first().contents().get(0)?.textContent.trim();
        const weapon = weapons[weaponChar] || '';

        // Build message
        const message = weapon ? `$ ${money} + ${weapon}` : `$ ${money}`;

        // Fill and submit for team chat (messagemode2)
        $input.data('messagemode', 'messagemode2');
        $input.val(message);
        $input.submit();
      }
    });
  }

  // Poll until jQuery ($) is loaded, then init
  const intervalId = setInterval(() => {
    if (typeof $ !== 'undefined') {
      clearInterval(intervalId);
      initKeyListener();
    }
  }, 500);

})();
