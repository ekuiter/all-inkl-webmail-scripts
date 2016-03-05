// ==UserScript==
// @name         All-Inkl Webmail - Favicon-Anzeige
// @namespace    http://elias-kuiter.de/
// @version      1.1
// @description	 Zeigt die Anzahl ungelesener Mails im Tab-Symbol an.
// @author       Elias Kuiter
// @match        https://webmail.all-inkl.com/index.php?WID=*
// @grant        none
// @downloadURL  https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Favicon-Anzeige.user.js
// @updateURL    https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Favicon-Anzeige.user.js
// @require      https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/lib/pnglib.js
// ==/UserScript==

/*
  This userscript uses techniques explained here:
  http://stackoverflow.com/questions/260857/changing-website-favicon-dynamically
  http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
  https://www.arduino.cc/en/Reference/Map
  https://iconverticons.com/online/
  http://www.digole.com/tools/PicturetoC_Hex_converter.php (16x16, HEX:0x, 256 Color)
  https://en.wikipedia.org/wiki/8-bit_color
*/

document.head = document.head || document.getElementsByTagName("head")[0];
var width = 16, height = 16, color_depth = 256, digit_height = 5, digit_width = 3,
    r = 255, g = 186, b = 59, bg_r = 54, bg_g = 54, bg_b = 54, unreadMailCount = 0,
    digits = [
        [ "OOO", "  O", "OOO", "OOO", "O O", "OOO", "OOO", "OOO", "OOO", "OOO" ],
        [ "O O", "  O", "  O", "  O", "O O", "O  ", "O  ", "  O", "O O", "O O" ],
        [ "O O", "  O", " O ", " O ", "OOO", "OOO", "OOO", "  O", "OOO", "OOO" ],
        [ "O O", "  O", "O  ", "  O", "  O", "  O", "O O", "  O", "O O", "  O" ],
        [ "OOO", "  O", "OOO", "OOO", "  O", "OOO", "OOO", "  O", "OOO", "OOO" ]
    ], favicon = [
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
    ], faviconAlphaColor = 0xff;

/*
 * Changes the favicon
 * src (string): URL or data URI of the new favicon
 * type (string, optional): favicon MIME type (optional for .ico)
 */
function changeFavicon(src, type) {
    var $$ = document.querySelector.bind(document);
    while ($$("link[rel=icon]"))
        $$("link[rel=icon]").remove();
    while ($$("link[rel='shortcut icon']"))
        $$("link[rel='shortcut icon']").remove();
    var link = document.createElement("link");
    link.rel = "shortcut icon";
    if (type)
        link.type = type;
    link.href = src;
    document.head.appendChild(link);
}

/*
 * Draws a colored pixel on a given PNG
 * p (PNGlib): PNG to draw on
 * x, y (number): point coordinates (adjust if scale larger than 1!)
 * r, g, b (number): pixel color
 * scale (number, optional): larger than 1 to scale up
 * a (number, optional): alpha value (0=transparent, 255=opaque)
 */
function setPixel(p, x, y, r, g, b, scale, a) {
    scale = scale || 1;
    x *= scale, y *= scale;
    for (var i = 0; i < scale; i++)
        for (var j = 0; j < scale; j++)
            p.buffer[p.index(x + i, y + j)] = p.color(r, g, b, a);
}

/*
 * Draws a straight vertical or horizontal line on a given PNG
 * p (PNGlib): PNG to draw on
 * x1, y1 (number): first point coordinates (adjust if scale larger than 1!)
 * x2, y2 (number): second point coordinates
 * r, g, b (number): line color
 * scale (number, optional): larger than 1 to scale up
 */
function drawLine(p, x1, y1, x2, y2, r, g, b, scale) {
    if (y1 === y2)
        for (var i = x1; i <= x2; i++)
            setPixel(p, i, y1, r, g, b, scale);
    if (x1 === x2)
        for (var i = y1; i <= y2; i++)
            setPixel(p, x1, i, r, g, b, scale);
}

/*
 * Fills a PNG with raw image data
 * p (PNGlib): PNG to draw on
 * data (array): an array of pixel colors, one byte per pixel (0bRRRGGGBB)
 * alphaColor (number, optional): a color which should be transparent (0bRRRGGGBB)
 */
function fillPNG(p, data, alphaColor) {
    function map(x, in_min, in_max, out_min, out_max) {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    for (var i = 0; i < data.length; i++) {
        var r = map((data[i] >> 5) & 0b111, 0, 7, 0, 255),
            g = map((data[i] >> 2) & 0b111, 0, 7, 0, 255),
            b = map( data[i]       &  0b11, 0, 3, 0, 255);
        setPixel(p, i % width, Math.floor(i / width), r, g, b, 1, data[i] === alphaColor ? 0 : 255);
    }
}


/*
 * Draws a digit on a given PNG
 * p (PNGlib): PNG to draw on
 * digit (number): digit to draw (0-9)
 * x_offset, y_offset (number): top left digit coordinates
 * r, g, b (number): digit foreground color
 * bg_r, bg_g, bg_b (number): digit background color
 * scale (number, optional): larger than 1 to scale up
 */
function drawDigit(p, digit, x_offset, y_offset, r, g, b, bg_r, bg_g, bg_b, scale) {
    scale = scale || 1;
    x_offset /= scale, y_offset /= scale;
    for (var y = 0; y < digit_height; y++)
        for (var x = 0; x < digit_width; x++)
            if (digits[y][digit][x] === ' ')
                setPixel(p, x_offset + x, y_offset + y, bg_r, bg_g, bg_b, scale);
            else
                setPixel(p, x_offset + x, y_offset + y, r, g, b, scale);
}

/*
 * Creates a PNG with a specific background (favicon) and a number in the foreground
 * number (number): number to display (multiple digits allowed)
 * r, g, b (number): number foreground color
 * bg_r, bg_g, bg_b (number): number background color
 * scale (number, optional): larger than 1 to scale up
 */
function makePNG(number, r, g, b, bg_r, bg_g, bg_b, scale) {
    scale = scale || 1;
    var p = new PNGlib(width, height, color_depth), background = p.color(0, 0, 0, 0),
        x = function(n) { return width  - n * digit_width  * scale - 1; },
        y = function(n) { return height - n * digit_height * scale - 1; };
    fillPNG(p, favicon, faviconAlphaColor);
    if (number != 0) {
        for (var i = 0; number != 0; i++) {
            drawDigit(p, number % 10, x(i + 1), y(1), r, g, b, bg_r, bg_g, bg_b, scale);
            number = Math.floor(number / 10);
        }
        drawLine(p, x(i)    , y(1) - 1, x(0)    , y(1) - 1, bg_r, bg_g, bg_b); // top
        drawLine(p, x(i) - 1, y(1) - 1, x(i) - 1, y(0)    , bg_r, bg_g, bg_b); // left
        drawLine(p, x(i) - 1, y(0)    , x(0)    , y(0)    , bg_r, bg_g, bg_b); // bottom
        drawLine(p, x(0)    , y(1) - 1, x(0)    , y(0)    , bg_r, bg_g, bg_b); // right
    }
    return "data:image/png;base64," + p.getBase64();
}

/*
 * Returns the number of unread mails
 */
function getUnreadMailCount() {
    return document.title[0] === "(" && document.title.split(")")[0].substr(1);
}

/*
 * Checks whether the favicon needs to be updated and, if necessary, does that
 */
function refreshFavicon() {
    if (getUnreadMailCount() != unreadMailCount) {
        unreadMailCount = getUnreadMailCount();
        changeFavicon(makePNG(unreadMailCount, r, g, b, bg_r, bg_g, bg_b, 2), "image/png");
    }
}

window.setInterval(function() {
    try {
    refreshFavicon();
    } catch (e) {}
}, 1000);