// ==UserScript==
// @name         All-Inkl Webmail - Schnelle Filter
// @namespace    http://elias-kuiter.de/
// @version      1.1
// @description	 Mit einem Klick Verschiebefilter erstellen.
// @author       Elias Kuiter
// @match        https://webmail.all-inkl.com/index.php?WID=*
// @grant        GM_xmlhttpRequest
// @grant		 unsafeWindow
// ==/UserScript==

var apiPath = "/ajax.php";
var dependencies = ["aiwm", "aiwm.main", "aiwm.main.showMsg", "aiwm.core", "aiwm.core.WID"];
var $ = unsafeWindow.$, aiwm = unsafeWindow.aiwm;
var currentMail = { folder: null, mail: null };
var LOGGER = function(data) { console.log(data) };
var TOAST = function(response) { toast(data.msg, "success", true) };

waitForDependencies();

/*
 * Wrapper Functions
 * =================
 */

/*
 * Internal helper
 */
function runUntilTrueWrapper(func, callback) {
  return function() {
    if (func()) {
      if (typeof callback == "function") callback();
    } else
      window.setTimeout(runUntilTrueWrapper(func, callback), 100);
  };
}

/*
 * Runs a function in 100ms intervals until it returns true
 * func (function): Function that should return true
 * callback (function): Called after func returned true
 */
function runUntilTrue(func, callback) {
  runUntilTrueWrapper(func, callback)();
}

/*
 * Runs a function in 100ms intervals
 * func (function): Function to run
 */
function runLoop(func) {
  func();
  window.setInterval(func, 100);
}

/*
 * Initialization
 * ==============
 */

/*
 * Waits for Webmail to be loaded
 */
function waitForDependencies() {
  runUntilTrue(function() {
    var dependenciesLoaded = true;
    for (var i = 0; i < dependencies.length; i++)
      if (dependenciesLoaded && eval("typeof unsafeWindow." + dependencies[i]) == "undefined")
        dependenciesLoaded = false;
    return dependenciesLoaded;
  }, initScript);
}

/*
 * Initializer
 */
function initScript() {
  runLoop(getCurrentMail);
  addUIElements();
}

/*
 * Core Functions
 * ==============
 */

/*
 * Gets the folder and ID of the currently selected mail
 * and stores it inside the "currentMail" variable
 */
function getCurrentMail() {
  var folder = null, mail = null;
  var iframeSrc = $("#mail-mailframe iframe").attr("src");
  if ($("#mail-mailheader").hasClass("nomail")) {
  } else if (iframeSrc && iframeSrc.indexOf("/mail-body.php") > -1) {
    var parts = iframeSrc.split("?")[1].split("&");
    folder = atob(decodeURIComponent(parts[0].split("=")[1]));
    mail = parseInt(decodeURIComponent(parts[1].split("=")[1]));
  }
  if (currentMail.folder != folder || currentMail.mail != mail)
    currentMail = { folder: folder, mail: mail };
}

/*
 * Adds a button used to trigger the script's functionality
 */
function addUIElements() {
  runUntilTrue(function() {
    return $("#mail-toolbar .item.btn.refresh").length > 0;
  }, function() {
    getFolders(function(folders) {
      select = "<select id=\"folders\" style=\"float: left; margin: 9px 0 0 22px\">";
      for (var i = 0; i < folders.length; i++)
        select += "<option value=\"" + folders[i].path + "\">" + folders[i].name + "</option>";
      $("#mail-toolbar .item.btn.refresh").after(select + "</select>");
      $("select#folders").after("<div class=\"item btn\" id=\"move-to\" style=\"float: left; margin-left: 8px\">Immer verschieben</div>");
      // This...
      //unsafeWindow.document.getElementById("move-to").addEventListener("click", moveToButtonClick, false);
      // or this...
      //$("#move-to")[0].addEventListener("click", moveToButtonClick, false);
      // ...is supposed to work in Firefox/Greasemonkey. For some reason it doesn't. (In Chrome both works fine.) Solutions appreciated.
      $("#move-to").click(moveToButtonClick);
      $("#move-to").after("<input type=\"radio\" name=\"address\" value=\"mail\" id=\"mail\" style=\"float: left; margin: 12px 0 0 14px\" checked><label for=\"mail\" style=\"float: left; margin: 12px 0 0 6px\">nur diese Adresse</label>" +
                          "<input type=\"radio\" name=\"address\" value=\"domain\" id=\"domain\" style=\"float: left; margin: 12px 0 0 14px\"><label for=\"domain\" style=\"float: left; margin: 12px 0 0 6px\">die ganze Domain</label>")
    });
  });
}

/*
 * Called whenever the "Move to ..." button is clicked
 */
function moveToButtonClick() {
  if (currentMail.folder == null || currentMail.mail == null) return;
  function proceed(from) {
    var folder = $("select#folders").val();
    var onlyDomain = $("input:radio[name=address]:checked").val() == "domain";
    if (!folder) return;
    if (onlyDomain)
      from = "@" + from.split("@")[1];
    createMoveFilter(from, from, folder, TOAST);
  }
  if (currentMail.from) {
    proceed(currentMail.from);
  } else {
    getMailInfo(currentMail.folder, currentMail.mail, function(data) {
      currentMail.from = data.from;
      proceed(currentMail.from);
    });
  }
}

/*
 * API related
 * ===========
 */

/*
 * Calls the Webmail API
 * action (string): The API action to perform
 * postData (object): Data the API should receive
 * callback (function): Called on success
 */
function callApi(action, postData, callback) {
  var dataString = "WID=" + aiwm.core.WID + "&a=" + action;
  for(var key in postData) {
    if(postData.hasOwnProperty(key))
      dataString += "&" + key + "=" + postData[key];
  }
  GM_xmlhttpRequest({
    method: "POST", url: apiPath, data: dataString,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    onload: function(response) {
      data = JSON.parse(response.responseText);
      if (!data.hasOwnProperty("result") || data.result == true) {
        if (typeof callback == "function") callback(data);
      } else
        toast(data.msg, "error", true);
    },
    onerror: function(response) {
      toast("AJAX-Fehler", "error", true);
    }
  });
}

/*
 * Creates a spam filter
 * (supports only one condition and one action)
 * name (string): The filter's name
 * condition (object): Example: {
 *   target: "from",			// Mails "from" and ...
 *   condition: "contains", 	// "containing" ...
 *   value: "mail@example.com"  // "mail@example.com" ...
 * }
 * action (object): Example: {
 *   action: "move",			// will be "moved" ...
 *   target: btoa("INBOX") 		// to the "INBOX" folder ("move" requires a Base64 "target")
 * }
 * callback (function): Called on success
 * To figure out the condition and action objects, visit Webmails Spam filter pane,
 * create the filter as you like and observe the XMLHttpRequests Chrome logs,
 * the "Form Data" section contains everything you need.
 */
function createFilter(name, condition, action, callback) {
  callApi("exec-pref-userfilter-save", {
    "postData[pref-spam-userfilter-name]": name,
    "postData[andlink]": 1,
    "postData[pref-spam-userfilter-cond][target][0]": condition.target,
    "postData[pref-spam-userfilter-cond][condition][0]": condition.condition,
    "postData[pref-spam-userfilter-cond][value][0]": condition.value,
    "postData[pref-spam-userfilter-action][action][0]": action.action,
    "postData[pref-spam-userfilter-action][target][0]": action.target
  }, callback);
}

/*
 * Creates a spam filter that moves mails into a specific folder
 * name (string): The filter's name
 * from (string): The mail address whose mails should be moved
 * folder (string): The folder into which they should be moved
 * callback (function): Called on success
 */
function createMoveFilter(name, from, folder, callback) {
  createFilter(name,
               { target: "from", condition: "contains", value: escapeRegExp(from) },
               { action: "move", target: btoa(folder) },
               callback);
}

/*
 * Fetches information on a specific mail
 * folder (string): The mail's folder
 * mail (int): The mail's id
 * callback (function): Called on success
 */
function getMailInfo(folder, mail, callback) {
  callApi("data-mail-mailinfo", {
    dir: btoa(folder),
    uid: mail
  }, callback);
}

/*
 * Fetches a folder array
 * callback (function): Called on success
 */
function getFolders(callback) {
  callApi("data-mail-dirlist", { }, function(data) {
    var folders = [];
    for (var i = 0; i < data.dirlist.length; i++) {
      var folder = data.dirlist[i];
      var path = atob(folder.path);
      var name = folder.level == 0 ? folder.name : path;
      folders.push({ name: name, path: path });
    }
    if (typeof callback == "function")
      callback(folders);
  });
}

/*
 * UI related
 * ==========
 */

/*
 * Shows a toast message
 * message (string): Message to show
 * klass (string): Which CSS class to apply (info, note, success or error)
 */
function toast(message, klass) {
  aiwm.main.showMsg("Schnelle Filter: " + message, klass, true);
}

/*
 * Others
 * ======
 */

/*
 * Escapes a String to not contain RegExp-sensitive characters
 * string (string): The string to escape
 * see: http://stackoverflow.com/questions/3446170
 */
function escapeRegExp(string) {
  return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}