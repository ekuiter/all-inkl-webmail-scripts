// ==UserScript==
// @name         All-Inkl Webmail - Ordner öffnen
// @namespace    http://elias-kuiter.de/
// @version      1.0
// @description	 Klappt alle Webmail-Ordner automatisch aus.
// @author       Elias Kuiter
// @match        https://webmail.all-inkl.com/index.php?WID=*
// @grant        none
// ==/UserScript==

var parentFolderNodes = "#mail-dirlist .item.folder.container";
var invisibleFolderNodes = parentFolderNodes + " ul";

function openFolders() {
  var nodes = document.querySelectorAll(invisibleFolderNodes);
  for (var i = 0; i < nodes.length; i++)
    display(nodes[i]);
}

function display(node) {
  node.style.display = "block";
}

window.setInterval(function() {
	try {
	  openFolders();
	} catch (e) {}
}, 100);