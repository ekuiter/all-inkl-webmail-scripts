// ==UserScript==
// @name         All-Inkl Webmail - Ordner öffnen
// @namespace    http://elias-kuiter.de/
// @version      1.2
// @description	 Klappt alle Webmail-Ordner automatisch aus.
// @author       Elias Kuiter
// @match        https://webmail.all-inkl.com/index.php?WID=*
// @grant        none
// @downloadURL  https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Ordner%20%C3%B6ffnen.user.js
// @updateURL    https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Ordner%20%C3%B6ffnen.user.js
// ==/UserScript==

var parentFolderNodes = "#mail-dirlist .item.folder.container";
var ignoredNodes = [/*insert folder title strings that will NOT be opened*/];

function openFolders() {
  var nodes = document.querySelectorAll(parentFolderNodes);
  for (var i = 0; i < nodes.length; i++)
    if (ignoredNodes.indexOf(nodes[i].title) === -1)
        display(nodes[i].children[1]);
}

function display(node) {
  node.style.display = "block";
}

window.setInterval(function() {
	try {
	  openFolders();
	} catch (e) {}
}, 100);
