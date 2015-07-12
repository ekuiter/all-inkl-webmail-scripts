##Userscripts für All-Inkl Webmail

Dieses Repository enthält einige Skripte, um das Webmail-Interface von All-Inkl / KAS in seiner Bedienung anzupassen. Die Skripte sind im Folgenden kurz aufgeführt & erläutert.

###Schnelle Filter
Dieses Skript hilft beim schnellen Erstellen von Filtern, um E-Mails von bestimmten Absendern automatisiert in Ordner zu verschieben. Ein sehr nützliches Feature, welches im normalen Interface leider recht unkomfortabel ist.

So kann man (in Anlehnung an Outlook.com) zu jeder E-Mail mit einem Klick einen Filter erstellen, der Mails dieses Absenders ab sofort verschiebt. Den Zielordner kann man entweder vorab auswählen oder auch direkt neu erstellen. Außerdem kann man alle E-Mails eines Absenders rückwirkend verschieben (also diejenigen, die nicht von einem neuen Filter betroffen sind).

Das Skript fügt neue Bedienelemente zur Symbolleiste im E-Mail-Bereich hinzu (links vom Suchfeld). Ein Klick auf den `Schnelle Filter`-Button und anschließend `Hilfe / Info ...` verrät mehr über die Bedienung des Skriptes.

**Installation**: Wenn [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) installiert ist, einfach hier klicken: https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Schnelle%20Filter.user.js

Funktioniert im Chrome mit Tampermonkey (Versionen: 40/3.9).
(Leider *nicht* im Firefox, s. Zeile 135 im Skript, bitte um Tipps.)

###Ordner öffnen
Dieses Skript sorgt dafür, dass die komplette Ordnerliste im Mailbereich ständig ausgeklappt ist. Das gefällt mir persönlich besser, denn standardmäßig sind alle Ordner zugeklappt. (Zu beachten ist, dass mit eingeschaltetem Skript die Ordner auch nicht mehr geschlossen werden können.)

**Installation**: Wenn [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) bzw. [Greasemonkey](https://addons.mozilla.org/de/firefox/addon/greasemonkey/) installiert ist, einfach hier klicken: https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Ordner%20%C3%B6ffnen.user.js

Funktioniert im Chrome mit Tampermonkey und im Firefox mit Greasemonkey (Versionen: 40/3.9, 33/2.3).

###Ordner-Mail-Anzahl
Dieses Skript blendet auch neben Ordern die Anzahl enthaltener E-Mails ein, die selbst keine Mails (sondern nur Unterordner) enthalten.
So behält man einen besseren Überblick, falls man verschachtelte Ordnerstrukturen benutzt (funktioniert auch bei mehreren Schachtelungsebenen).
Das Skript funktioniert auch, falls das "Ordner öffnen"-Skript installiert ist.

**Installation**: Wenn [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) bzw. [Greasemonkey](https://addons.mozilla.org/de/firefox/addon/greasemonkey/) installiert ist, einfach hier klicken: https://github.com/ekuiter/all-inkl-webmail-scripts/raw/master/All-Inkl%20Webmail%20-%20Ordner-Mail-Anzahl.user.js

Getestet im Chrome mit Tampermonkey (Versionen: 43/3.11).
Nicht getestet im Firefox.

© Elias Kuiter 2015 - http://www.elias-kuiter.de/
