// ==UserScript==
// @name         All-Inkl Webmail - Favicon-Anzeige
// @namespace    http://elias-kuiter.de/
// @version      1.2
// @description	 Zeigt die Anzahl ungelesener Mails im Tab-Symbol an.
// @author       Elias Kuiter
// @match        https://webmail.all-inkl.com/index.php?WID=*
// @grant        none
// @downloadURL  https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Favicon-Anzeige.user.js
// @updateURL    https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Favicon-Anzeige.user.js
// @require      https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/lib/pnglib.js
// @require      https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/lib/number-favicon.js
// ==/UserScript==

var numberFavicon = new NumberFavicon(
  new Color(255, 186, 59), // digit foreground color
  new Color(54, 54, 54), // digit background color
  0xff, // alpha color for background in binary format 0bRRRGGGBB, null if no alpha color needed
  // Background image (16x16px) in the above binary format (one byte per pixel, 0bRRRGGGBB).
  // You can generate such an array here: http://www.digole.com/tools/PicturetoC_Hex_converter.php
  // Choose format "HEX:0x", used for "256 Color ..." (and possibly resize to 16x16px).
  // You need to upload a PNG file, so use this: https://iconverticons.com/online/ or something
  [ // similar to convert your ICO file to PNG. If you don't want a background image, see below.
    0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff
    ,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff
    ,0xff,0xff,0xf7,0xe9,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xfb,0xff
    ,0xff,0xff,0xe1,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xff,0xff
    ,0xff,0xfb,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe1,0xff,0xff
    ,0xff,0xf6,0xe0,0xe0,0xe9,0xf7,0xf6,0xf6,0xf6,0xf7,0xf2,0xe0,0xe0,0xe5,0xff,0xff
    ,0xff,0xee,0xe0,0xe0,0xe5,0xf6,0xff,0xff,0xff,0xf7,0xea,0xe0,0xe0,0xee,0xff,0xff
    ,0xff,0xe9,0xe0,0xe1,0xff,0xea,0xf2,0xfb,0xee,0xf2,0xfb,0xe0,0xe0,0xf2,0xff,0xff
    ,0xff,0xe1,0xe0,0xe5,0xff,0xff,0xf2,0xee,0xfb,0xff,0xf2,0xe0,0xe0,0xfb,0xff,0xff
    ,0xff,0xe0,0xe0,0xee,0xff,0xff,0xff,0xff,0xff,0xff,0xee,0xe0,0xe0,0xff,0xff,0xff
    ,0xfb,0xe0,0xe0,0xe9,0xf2,0xf2,0xf2,0xf2,0xf2,0xf2,0xe5,0xe0,0xe1,0xff,0xff,0xff
    ,0xf2,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe9,0xff,0xff,0xff
    ,0xee,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe0,0xe1,0xf2,0xff,0xff
    ,0xfb,0xe9,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xe5,0xea,0xff
    ,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff
    ,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff,0xff
  ]
);

/* // If you don't want to use a background image, just omit alpha color and image array:
var numberFavicon = new NumberFavicon(
  new Color(255, 186, 59), // digit foreground color
  new Color(54, 54, 54) // digit background color
); */

window.setInterval(function() {
  try {
    numberFavicon.refresh(function() {
      // returns the number that should be displayed on the favicon
      return document.title[0] === "(" && document.title.split(")")[0].substr(1);
    });
  } catch (e) {}
}, 1000);