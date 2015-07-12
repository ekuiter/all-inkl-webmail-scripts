// ==UserScript==
// @name         All-Inkl Webmail - Ordner-Mail-Anzahl
// @namespace    http://elias-kuiter.de/
// @version      1.0
// @description	 Blendet Anzahl der Mails auch neben Ordnern ein, die selbst keine Mails enthalten.
// @author       Elias Kuiter
// @match        https://webmail.all-inkl.com/index.php?WID=*
// @grant        none
// ==/UserScript==

var parentFolderNodes = "#mail-dirlist .item.folder.container";

function countFolders() {
  var nodes = document.querySelectorAll(parentFolderNodes);
  for (var i = 0; i < nodes.length; i++) {
    var totalCount = mailCount(nodes[i], "ul > li > a > .count > .count-total");
    var unseenCount = mailCount(nodes[i], "ul > li > a > .count > .count-unseen");
    if (!isNaN(totalCount)) {
      var countNode = nodes[i].querySelector("a > .count.directory-count");
      if (countNode)
        countNode.parentNode.removeChild(countNode);
      countNode = document.createElement("span");
      countNode.className = "count directory-count";
      if (!isNaN(unseenCount) && unseenCount > 0)
        countNode.innerHTML = '(<span>' + totalCount + '</span><span class="count-trenner">|</span><span class="count-unseen">' + unseenCount + '</span>)';
      else
        countNode.innerHTML = '(<span>' + totalCount + '</span><span class="count-trenner hide">|</span><span class="count-unseen hide"></span>)';
      nodes[i].querySelector("a").insertBefore(countNode, nodes[i].querySelector("a .context"));
    }
  }
}

function mailCount(node, sel) {
  var childNodes = node.querySelectorAll(sel);
  var mailCount = 0;
  for (var j = 0; j < childNodes.length; j++)
    mailCount += parseInt(childNodes[j].innerText);
  return mailCount;
}

window.setInterval(function() {
  try {
    countFolders();
  } catch (e) {}
}, 1000);