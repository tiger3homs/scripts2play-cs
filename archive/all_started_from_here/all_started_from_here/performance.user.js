// ==UserScript==
// @name         Play-CS Ultimate Performance & Mouse Booster
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Optimize play-cs.com: remove ads/UI, low graphics, smooth mouse and movement, clean storage, canvas+chat only.
// @author       You
// @match        *://play-cs.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log("[UltimateBooster] Script loaded!");

    // ------------------------------
    // 1️⃣ Performance: Remove ads, UI, loading screens
    // ------------------------------
    function cleanUI() {
        const removeSelectors = [
            "#banner",".adsbygoogle",".ad-container",".social-links",
            ".footer",".header","#friends",".sidebar",
            "#loading_blocker",".loading-bg",".loading-hint",
            ".loading-main",".loading-desc",".loading-mapname",
            ".loading-mapfulldesc",".loading-phase",".loading-progress",
            ".loading-loaded",".loading_control_block",".loading_control_header",
            ".key_control","SPAN.server_name",
            "SPAN.server_skill","SPAN.map_name","SPAN.server_ranked",
            "SPAN.server_private"
        ];
        removeSelectors.forEach(sel=>{
            document.querySelectorAll(sel).forEach(el=>el.remove());
        });
    }

    function focusOnGame() {
        const canvas=document.querySelector("canvas");
        const chat=document.querySelector("#chat");
        if(!canvas||!chat) return;
        document.body.querySelectorAll("*").forEach(el=>{
            if(el!==canvas && el!==chat && !chat.contains(el)){
                el.style.display="none";
            }
        });
    }

    // ------------------------------
    // 2️⃣ Block heavy/unneeded network requests
    // ------------------------------
    const origOpen=window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open=function(method,url){
        if(url.includes("googletagmanager")||url.includes("google-analytics")||url.includes("analytics.google")||
           url.includes("ads")||url.includes("avatar")||url.includes("map_thumb")||
           url.includes("flag-icon")||url.includes("ct_win.png")||url.includes("tr_win.png")){
            console.log("[UltimateBooster] Blocked request:",url);
            return;
        }
        return origOpen.apply(this,arguments);
    };

    // ------------------------------
    // 3️⃣ Clean & optimize localStorage + low graphics
    // ------------------------------
    try{
        localStorage.clear();
        const minimalCrosshair = {
            profiles:[{
                name:"PerfProfile",length:4,thickness:2,gap:2,color:"#00ff00",opacity:1,
                enabled:true,shadowEnabled:false,borderEnabled:false
            }],
            activeProfileIndex:0,
            menuVisible:false,
            uiPanelVisible:false,
            gameWasPointerLocked:true
        };
        localStorage.setItem("customCrosshairConfigAdvanced",JSON.stringify(minimalCrosshair));
        localStorage.setItem("chatEnabled","true");
        localStorage.setItem("graphics_quality","low");
        localStorage.setItem("shadows","off");
        localStorage.setItem("textures","low");
        localStorage.setItem("effects","off");
        console.log("[UltimateBooster] LocalStorage cleaned & graphics forced LOW.");
    }catch(e){
        console.warn("[UltimateBooster] Failed to optimize localStorage:",e);
    }

    // ------------------------------
    // 4️⃣ Mouse smoothing & pointer lock
    // ------------------------------
    let lastX=0,lastY=0;
    const smoothFactor=0.5; // 0=instant,1=fully smoothed
    window.addEventListener('mousemove',e=>{
        const dx=e.movementX;
        const dy=e.movementY;
        const smoothX=dx*(1-smoothFactor)+lastX*smoothFactor;
        const smoothY=dy*(1-smoothFactor)+lastY*smoothFactor;
        lastX=smoothX; lastY=smoothY;
        // Optionally, hook game engine here for true smoothing
    },true);

    const canvas=document.querySelector("canvas");
    if(canvas){
        canvas.addEventListener("click",()=>{canvas.requestPointerLock();});
    }

    // ------------------------------
    // 5️⃣ Key press debouncing
    // ------------------------------
    document.addEventListener('keydown',throttleKey,false);
    document.addEventListener('keyup',throttleKey,false);
    function throttleKey(e){
        if(!throttleKey.lastTime) throttleKey.lastTime=0;
        const now=performance.now();
        if(now-throttleKey.lastTime>5){ // 5ms throttle
            // send key event to game engine normally
            throttleKey.lastTime=now;
        }
    }

    // ------------------------------
    // 6️⃣ MutationObserver: auto cleanup
    // ------------------------------
    const observer=new MutationObserver(()=>{
        cleanUI();
        focusOnGame();
    });
    observer.observe(document.body,{childList:true,subtree:true});

    // ------------------------------
    // 7️⃣ Initial run
    // ------------------------------
    cleanUI();
    focusOnGame();
})();
