// ==UserScript==
// @name         All-Inkl Webmail - Header
// @namespace    http://elias-kuiter.de/
// @version      1.0
// @description	 Passt den Header an.
// @author       Elias Kuiter
// @match        https://webmail.all-inkl.com/index.php?WID=*
// @grant        none
// ==/UserScript==

function setHeader(visible) {
    ["#topbar", "#toplogo", "#topuserinfo", "#toplogout", "#topborder"].forEach(function(e) {
        document.querySelector(e).style.display = visible ? "block" : "none";
    });
    document.querySelector("#main").style.top = visible ? "" : "0";
    return visible;
}

window.setTimeout(function fn() {
    try {
        var state = setHeader(false);
        document.addEventListener("keydown", function(e) {
            console.log(e.code);
            if (e.ctrlKey && e.code === "KeyX")
                state = setHeader(!state);
        });
    } catch (e) {
        window.setTimeout(fn, 100);
    }
}, 100);
