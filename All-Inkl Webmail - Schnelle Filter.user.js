// ==UserScript==
// @name         All-Inkl Webmail - Schnelle Filter
// @namespace    http://elias-kuiter.de/
// @version      1.1
// @description	 Mit einem Klick Verschiebefilter erstellen.
// @author       Elias Kuiter
// @match        https://webmail.all-inkl.com/index.php?WID=*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

var apiPath = "/ajax.php";
var dependencies = ["aiwm", "aiwm.main", "aiwm.main.showMsg", "aiwm.core", "aiwm.core.WID"];
var $ = unsafeWindow.$, aiwm = unsafeWindow.aiwm;
var currentMail = { folder: null, mail: null };
var LOGGER = function(data) { console.log(data) };
var TOAST = function(data) { toast(data.msg, "success", true) };

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
      var select = "<select id=\"filters-folders\" style=\"float: left; margin: 9px 0 0 20px\">";
      select += selectOptions(folders);
      $("#mail-toolbar .item.btn.refresh").after(select + "</select>");
      $("select#filters-folders").after("<div class=\"item btn\" id=\"filters-move-to\" style=\"float: left\">Immer verschieben</div>");
      // This...
      //unsafeWindow.document.getElementById("move-to").addEventListener("click", moveToButtonClick, false);
      // or this...
      //$("#move-to")[0].addEventListener("click", moveToButtonClick, false);
      // ...is supposed to work in Firefox/Greasemonkey. For some reason it doesn't. (In Chrome both works fine.) Solutions appreciated.
      $("#filters-move-to").click(moveToButtonClick());
      $("#filters-move-to").after("<div class=\"item btn\" id=\"filters-move-to-new-folder\" style=\"float: left\">... in neuen Ordner</div>");
      $("#filters-move-to-new-folder").click(moveToNewFolderButtonClick);
      $("#filters-move-to-new-folder").after("<div class=\"item btn\" id=\"filters-move-to-afterwards\" style=\"float: left\">Verschieben</div>");
      $("#filters-move-to-afterwards").click(moveToAfterwardsButtonClick);
      $("#filters-move-to-afterwards").after("<div class=\"item btn pref\" id=\"filters-pref\" style=\"float: left\">" +
                                             "  <img src=\"https://webmail.all-inkl.com/layout/img/mail-pref.png\" alt=\"Schnelle Filter: Einstellungen\">" +
                                             "</div>");
      $("#filters-pref").click(prefButtonClick);
      $("#filters-pref").after("<div class=\"item btn\" id=\"filters-help\" style=\"float: left; margin-right: 20px\">?</div>");
      $("#filters-help").click(helpButtonClick);
    });
  });
}

/*
 * Fetches "from" for the current mail and "folder" / "folderName" from the select menu
 * folderInject (string): Overwrite the selected folder with another one
 * callback (function: Called on success with the context
 */
function withContext(folderInject, callback) {
  if (currentMail.folder == null || currentMail.mail == null) {
    toast("Es ist keine E-Mail ausgewählt.", "error", true);
    return;
  }
  function proceed() {
    if (!folderInject) {
      var folder = $("select#filters-folders").val();
      if (!folder) return;
      var folderName = $("select#filters-folders :selected").text();
    } else {
      var folder = folderInject;
      var folderName = folderInject;
    }
    var onlyDomain = GM_getValue("onlyDomain", false);
    var useFromName = GM_getValue("useFromName", false);
    var from = useFromName ? currentMail.fromName : currentMail.from;
    if (!useFromName && onlyDomain)
      from = "@" + from.split("@")[1];
    callback({ from: from, folder: folder, folderName: folderName });
  }
  if (currentMail.from) {
    proceed();
  } else {
    getMailInfo(currentMail.folder, currentMail.mail, function(data) {
      currentMail.from = data.from;
      currentMail.fromName = data.from_name;
      proceed();
    });
  }
}

/*
 * Returns the function called whenever the "Move to ..." button is clicked
 * folderInject (string): Overwrite the selected folder with another one
 */
function moveToButtonClick(folderInject) {
  return function() {
    withContext(folderInject, function(context) {
      createMoveFilter(context.from, context.from, context.folder, function(data) {
        toast(data.msg == "Der Filter wurde gespeichert." ? "E-Mails von <strong>" + context.from +
              "</strong> werden ab sofort in <strong>" + context.folderName + "</strong> verschoben." : data.msg, "success", true);
      });
    });
  };
}

/*
 * Called whenever the "... new folder" button is clicked
 */
function moveToNewFolderButtonClick() {
  var folderName = prompt("Gib den Namen des neuen Ordners ein. Unterordner mit / trennen:");
  if (!folderName) {
    toast("Du hast keinen Ordner eingegeben.", "error", true);
    return;
  }
  createMailFolder(folderName, function() {
    getFolders(function(folders) {
      $("select#filters-folders").html(selectOptions(folders));
    });
    moveToButtonClick(folderName)();
  });
}

/*
 * Called whenever the "Move to afterwards" button is clicked
 */
function moveToAfterwardsButtonClick() {
  var searchAll = GM_getValue("searchAll", false);
  withContext(null, function(context) {
    searchMails("FROM", context.from, searchAll ? "all" : "INBOX", function(mailData) {
      if (mailData.msg)
        toast(mailData.msg == "Es wurden keine E-Mails zu den Suchkriterien gefunden." ?
              "Keine E-Mails von diesem Absender gefunden. Suche evtl. in den Einstellungen auf alle Ordner ausweiten?" :
              mailData.msg, "error", true);
      else
        moveMails(mailData.mails, context.folder, function(data) {
          toast(data.msg == "Die markierten E-Mails wurden verschoben." ? "<strong>" + mailData.pager_count_all +
                "</strong> E-Mails von <strong>" + context.from + "</strong> wurden nach <strong>" +
                context.folderName + "</strong> verschoben." : data.msg, "success", true);
        });
    });
    toast("Durchsuche E-Mails ...", "info", true);
  });
}

/*
 * Called whenever the "Preferences" button is clicked
 */
function prefButtonClick() {  
  var onlyDomain = GM_getValue("onlyDomain", false);
  var useFromName = GM_getValue("useFromName", false);
  var searchAll = GM_getValue("searchAll", false);
  var prefWindow = window.open("", "filters_pref", "width=600,height=650,resizable=yes");
  $(prefWindow.document.head).html("<style>" +
                                   "  * { font-family: Arial, sans-serif; } input[type=radio] { margin-right: 8px; }" +
                                   "</style>");
  $(prefWindow.document.body).html("<h2>Schnelle Filter: Einstellungen</h2>" +
                                   "<p><small>" +
                                   "</small></p><h3>&quot;Immer verschieben&quot; / &quot;... in neuen Ordner&quot;</h3><p>Verschiebe E-Mails anhand ..." +
                                   "  <p><input type=\"radio\" name=\"from\" value=\"mail\" id=\"filters-pref-from-mail\" " +(useFromName ? "" : "checked") +
                                     "><label for=\"filters-pref-from-mail\">der E-Mail-Adresse (z.B. <em>juliamueller@gmail.com</em>)</label></p>" +
                                   "  <p><input type=\"radio\" name=\"from\" value=\"name\" id=\"filters-pref-from-name\" " + (useFromName ? "checked" : "") +
                                     "><label for=\"filters-pref-from-name\">des Absenders (z.B. <em>Julia Müller</em>)</label></p>" +
                                   "</p><hr /><div id=\"filters-pref-address\"><p><small>" +
                                   "  Willst du E-Mails einer Person mit einer ganz bestimmten E-Mail-Adresse verschieben, wähle <em>nur von dieser Adresse</em>.<br />" +
                                   "  Wenn du willst, dass alle E-Mails von einer Webseite verschoben werden, wähle <em>von der ganzen Domain</em>." +
                                   "  Das ist z.B. sinnvoll für Internetdienste wie Google oder Facebook." +
                                   "</small></p><p>Verschiebe E-Mails ..." +
                                   "  <p><input type=\"radio\" name=\"address\" value=\"mail\" id=\"filters-pref-address-mail\" " + (onlyDomain ? "" : "checked") +
                                     "><label for=\"filters-pref-address-mail\">nur von dieser Adresse (z.B. <em>juliamueller@gmail.com</em>)</label></p>" +
                                   "  <p><input type=\"radio\" name=\"address\" value=\"domain\" id=\"filters-pref-address-domain\"" + (onlyDomain ? "checked" : "") +
                                     "><label for=\"filters-pref-address-domain\">von der ganzen Domain (z.B. <em>@facebook.com</em>)</label></p>" +
                                   "</p><hr /></div><h3>&quot;Verschieben&quot;</h3><p><small>" +
                                   "  Falls du alle E-Mails eines Absenders verschieben willst (ohne einen Filter anzulegen), wähle hier, ob nur E-Mails aus dem" +
                                   "  Posteingang verschoben werden sollen oder auch aus anderen Ordnern." +
                                   "</small></p><p>Verschiebe E-Mails ..." +
                                   "  <p><input type=\"radio\" name=\"search\" value=\"inbox\" id=\"filters-pref-search-inbox\" " + (searchAll ? "" : "checked") +
                                     "><label for=\"filters-pref-search-inbox\">aus dem Posteingang</label></p>" +
                                   "  <p><input type=\"radio\" name=\"search\" value=\"all\" id=\"filters-pref-search-all\"" + (searchAll ? "checked" : "") +
                                     "><label for=\"filters-pref-search-all\">aus allen Ordnern</label></p>" +
                                   "</p>" +
                                   "  <input type=\"button\" id=\"filters-pref-save\" value=\"Speichern\">" +
                                   "</p>");
  var address = $("#filters-pref-address", prefWindow.document);
  function toggleAddressIfNeeded() {
    if ($("#filters-pref-from-mail", prefWindow.document)[0].checked)
      address.show();
    else
      address.hide();
  }
  toggleAddressIfNeeded();
  $("#filters-pref-from-mail, #filters-pref-from-name", prefWindow.document).change(toggleAddressIfNeeded);
  $("#filters-pref-save", prefWindow.document).click(prefSaveButtonClick(prefWindow));
}

/*
 * Returns the function called whenever the "Save" button in "Preferences" is clicked
 * prefWindow (object): The preferences window handle
 */
function prefSaveButtonClick(prefWindow) {
  return function() {
    GM_setValue("onlyDomain", $("input:radio[name=address]:checked", prefWindow.document).val() == "domain");
    GM_setValue("useFromName", $("input:radio[name=from]:checked", prefWindow.document).val() == "name");
    GM_setValue("searchAll", $("input:radio[name=search]:checked", prefWindow.document).val() == "all");
    prefWindow.close();
    toast("Die Einstellungen wurden gespeichert.", "success", true);
  };
}

/*
 * Called whenever the "Help" button is clicked
 */
function helpButtonClick() {
  var helpWindow = window.open("", "filters_help", "width=750,height=550,resizable=yes");
  $(helpWindow.document.head).html("<style>" +
                                   "  * { font-family: Arial, sans-serif; }" +
                                   "</style>");
  $(helpWindow.document.body).html("<h2>Schnelle Filter: Hilfe</h2>" +
                                   "<p>" +
                                   "  Dieses Userscript hilft dir beim Erstellen von Filtern und Verschieben von E-Mails. Es fügt mehrere Funktionen " +
                                   "  zur Hauptsymbolleiste von All-Inkl Webmail hinzu." +
                                   "</p><p>" +
                                   "  Userscript auf GitHub: <a href=\"https://github.com/ekuiter/all-inkl-webmail-scripts\" target=\"_blank\">" +
                                   "  ekuiter/all-inkl-webmail-scripts</a><br />Entwickler: <a href=\"http://elias-kuiter.de\" target=\"_blank\">Elias Kuiter</a>" +
                                   "</p><h3>&quot;Immer verschieben&quot;</h3><p>" +
                                   "  Dieser Button erstellt einen Filter zur gerade ausgewählten E-Mail, der neu eintreffende E-Mails des aktuellen Absenders" +
                                   "  automatisch in einen Ordner verschiebt. Dieser Ordner kann im Auswahlmenü links von den Buttons ausgewählt werden." +
                                   "</p><h3>&quot;... in neuen Ordner&quot;</h3><p>" +
                                   "  Wie &quot;Immer verschieben&quot;, allerdings muss der Ordner nicht ausgewählt, sondern beim Anklicken in ein Dialogfenster" +
                                   "  eingetragen werden. Der eingetragene Ordner wird dann angelegt. (Der Ordner darf Slashes enthalten, um Unterordner zu kennzeichnen:" +
                                   "  z.B. <em>Social/Facebook</em>, die Unterordner werden ggf. erstellt.)" +
                                   "</p><h3>&quot;Verschieben&quot;</h3><p>" +
                                   "  Verschiebt alle E-Mails des Absenders der gerade ausgewählten E-Mail (ohne einen Filter anzulegen) in den Ordner," +
                                   "  der im Auswahlmenü ausgewählt ist. Ob nur E-Mails aus dem Posteingang oder aus allen Ordnern verschoben werden sollen," +
                                   "  kann in den Einstellungen angepasst werden." +
                                   "</p>");
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
  for (var key in postData) {
    if (Array.isArray(postData[key]))
      for (var i = 0; i < postData[key].length; i++)
	    dataString += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(postData[key][i]);
    else if (postData.hasOwnProperty(key))
      dataString += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]);
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
 * Creates a folder
 * name (string): Folder to be created (MyFolder)
 * parent (string): Parent folder, may be path (MyDir/AnotherDir)
 * container (bool): Whether the folder should contain other folders (true) or mails (false)
 * callback (function): Called on success
 */
function createFolder(name, parent, container, callback) {
  callApi("exec-maildir-new", {
    name: name,
    dir: btoa(parent),
    container: container ? 1 : 0
  }, callback);
}

/*
 * Creates a mail folder
 * name (string): Mailfolder to be created, may be path (MyDir/AnotherDir/MyFolder)
 * callback (function): Called on success
 */
function createMailFolder(name, callback) {
  var folderParts = name.split("/");
  var parentFolders = folderParts.slice(0, -1).join("/");
  var childFolder = folderParts.slice(-1)[0];
  createFolder(childFolder, parentFolders, false, callback);
}

/*
 * Search for mails (without pagination)
 * searchIn (string): Field to search in (TEXT, FROM, SUBJECT, TO, CC, BCC)
 * searchString (string): What to search for
 * folder (string): Folder to search in, if "all", search in all folders
 * callback (function): Called on success
 */
function searchMails(searchIn, searchString, folder, callback) {
  var options = {
    mpp: 100000,
    p: 1,
    s: "date",
    sd: "desc",
	"search[alldirs]": folder == "all",
    "search[dirs][]": (folder == "all" ? null : btoa(folder))
  };
  options["search[string][" + searchIn + "]"] = searchString;
  callApi("data-mail-search", options, callback);
}

function moveMails(mails, targetFolder, callback) {
  var options = { target: btoa(targetFolder) };
  for (var i = 0; i < mails.length; i++) {
    var key = "emails[" + mails[i].folder_base64 + "][]";
    if (options[key] !== undefined)
      options[key].push(mails[i].uid);
    else
      options[key] = [mails[i].uid];
  }
  callApi("exec-mail-move", options, callback);
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
 * Extracts option elements from folders
 * folders (array): Array of folders by getFolders
 */
function selectOptions(folders) {
  options = "";
  for (var i = 0; i < folders.length; i++)
    options += "<option value=\"" + folders[i].path + "\">" + folders[i].name + "</option>";
  return options;
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