/*
Copyright (c) 2007-2009, Greg Marine
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.
    * Neither the name of Greg Marine nor the names of the contributors may be
    used to endorse or promote products derived from this software without
    specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
*/

pref("toolkit.defaultChromeURI", "chrome://kneemail/content/kneemail.xul");
pref("toolkit.singletonWindowType", "Kneemail");
//
pref("alerts.slideIncrement", 1);
pref("alerts.slideIncrementTime", 10);
pref("alerts.totalOpenTime", 4000);
pref("alerts.height", 50);
//
pref("browser.chromeURL", "chrome://kneemail/content/browser.xul");
//
pref("browser.download.folderList", 0);
pref("browser.download.manager.showAlertOnComplete", true);
pref("browser.download.manager.showAlertInterval", 2000);
pref("browser.download.manager.retention", 2);
pref("browser.download.manager.showWhenStarting", true);
pref("browser.download.manager.useWindow", true);
pref("browser.download.manager.closeWhenDone", false);
pref("browser.download.manager.openDelay", 0);
pref("browser.download.manager.focusWhenStarting", false);
pref("browser.download.manager.flashCount", 2);
pref("browser.download.useDownloadDir", false);
//
// pref("browser.link.open_newwindow", 3);
//
pref("browser.preferences.animateFadeIn", false);
pref("browser.preferences.instantApply", true);
//
pref("browser.xul.error_pages.enabled", true);
//
pref("dom.disable_open_during_load", true);
//
pref("extensions.getAddons.browseAddons", "http://addons.kneemailcentral.com/");
pref("extensions.getAddons.maxResults", 5);
pref("extensions.getAddons.recommended.browseURL", "http://addons.kneemailcentral.com/");
pref("extensions.getAddons.recommended.url", "http://community.activestate.com/xpi/api/%API_VERSION%/list/featured/all/10");
pref("extensions.getAddons.search.browseURL", "http://community.activestate.com/search/node/%TERMS%+type%3Axpi");
pref("extensions.getAddons.search.url", "http://community.activestate.com/xpi/api/%API_VERSION%/search/%TERMS%");
pref("extensions.getAddons.showPane", true);
//
pref("extensions.update.enabled", true);
pref("extensions.update.interval", 86400);
pref("extensions.dss.enabled", false);
pref("extensions.dss.switchPending", false);
pref("extensions.ignoreMTimeChanges", false);
pref("extensions.logging.enabled", false);
pref("extensions.update.url", "http://addons.kneemailcentral.com/");
pref("extensions.getMoreExtensionsURL", "http://addons.kneemailcentral.com/");
//
pref("general.skins.selectedSkin", "classic/1.0");
//
// pref("general.useragent.override", "Kneemail 2.0.0 (KneemailCentral.com; U; en-US; rv:1.9.0.4) Gecko/2008111310 Kneemail/20081230");
pref("general.useragent.extra.brand", "KneemailCentral.com/1.0.0/200905270");
//
pref("kneemail.backup.shutdown", false);
pref("kneemail.entries.defaulttype", 0);
pref("kneemail.entries.sort.column", "created");
pref("kneemail.entries.sort.direction", "DESC");
pref("kneemail.folders.sort", 0);
pref("kneemail.online.home", "http://dev.kneemailcentral.com/pg/dashboard/");
pref("kneemail.online.server", "http://dev.kneemailcentral.com");
pref("kneemail.online.autologin", false);
pref("kneemail.online.username", "");
pref("kneemail.path.backup", "");
pref("kneemail.path.backup.filename", "");
pref("kneemail.path.kneemaildb", "");
pref("kneemail.update.startup", false);
//
pref("network.http.use-cache", false);
//
pref("network.protocol-handler.expose-all", true);
pref("network.protocol-handler.expose.mailto", false);
pref("network.protocol-handler.expose.news", false);
pref("network.protocol-handler.expose.nntp", false);
pref("network.protocol-handler.expose.snews", false);
//
pref("network.protocol-handler.warn-external.http", false);
pref("network.protocol-handler.warn-external.https", false);
pref("network.protocol-handler.warn-external.ftp", false);
//
pref("print.print_headerright", "Kneemail Desktop");
//
pref("xpinstall.dialog.confirm", "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul");
pref("xpinstall.dialog.progress.chrome", "chrome://mozapps/content/extensions/extensions.xul?type=themes");
pref("xpinstall.dialog.progress.skin", "chrome://mozapps/content/extensions/extensions.xul?type=extensions");
pref("xpinstall.dialog.progress.type.chrome", "Extension:Manager-extensions");
pref("xpinstall.dialog.progress.type.skin", "Extension:Manager-themes");
pref("xpinstall.whitelist.add", "addons.kneemailcentral.com");

// Whether or not app updates are enabled
pref("app.update.enabled", true);

// This preference turns on app.update.mode and allows automatic download and
// install to take place. We use a separate boolean toggle for this to make
// the UI easier to construct.
pref("app.update.auto", false);

// If set to true, the Update Service will present no UI for any event.
pref("app.update.silent", false);

// Update service URL:
// You do not need to use all the %VAR% parameters. Use what you need, %PRODUCT%,%VERSION%,%BUILD_ID%,%CHANNEL% for example
pref("app.update.url", "https://kneemail.googlecode.com/files/kneemail_%BUILD_ID%_update_windows.xml");

// URL user can browse to manually if for some reason all update installation
// attempts fail.
pref("app.update.url.manual", "http://desktop.kneemailcentral.com/");

// A default value for the "More information about this update" link
// supplied in the "An update is available" page of the update wizard.
pref("app.update.url.details", "http://desktop.kneemailcentral.com/");

// Interval: Time between checks for a new version (in seconds)
//           default=1 day
pref("app.update.interval", 86400);

// Interval: Time before prompting the user to download a new version that
//           is available (in seconds) default=1 day
pref("app.update.nagTimer.download", 86400);

// Interval: Time before prompting the user to restart to install the latest
//           download (in seconds) default=30 minutes
pref("app.update.nagTimer.restart", 1800);

// Interval: When all registered timers should be checked (in milliseconds)
//           default=5 seconds
pref("app.update.timer", 600000);

// Whether or not we show a dialog box informing the user that the update was
// successfully applied. This is off in Firefox by default since we show a
// upgrade start page instead! Other apps may wish to show this UI, and supply
// a whatsNewURL field in their brand.properties that contains a link to a page
// which tells users what's new in this new update.
pref("app.update.showInstalledUI", true);

// 0 = suppress prompting for incompatibilities if there are updates available
//     to newer versions of installed addons that resolve them.
// 1 = suppress prompting for incompatibilities only if there are VersionInfo
//     updates available to installed addons that resolve them, not newer
//     versions.
pref("app.update.incompatible.mode", 0);