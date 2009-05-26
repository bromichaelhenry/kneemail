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

var EXPORTED_SYMBOLS = ["Kneemail", "KneemailOnline", "KneemailDB", "Utils", "DirUtils", "FileUtils", "JSON", "BrowserOffline", "Date"];

var objDirService = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
var groups = new Array();
var connected = false;

var Kneemail =
{
    login_manager : Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager),
    preferences : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
    prompts : Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService),
    sqlite : Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService),
    fav_icons : Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService),
    io_service : Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),

    get backup_filename() {return "kneemailbackup.zip";},
    
    get backup_path() {return this.preferences.getCharPref("kneemail.path.backup");},
    set backup_path(v) {this.preferences.setCharPref("kneemail.path.backup", v);},
    
    get database_filename() {return "kneemail.kdb";},

    get database_path() {return this.preferences.getCharPref("kneemail.path.kneemaildb");},
    set database_path(v) {this.preferences.setCharPref("kneemail.path.kneemaildb", v);},

    get filepicker_path() {return this.preferences.getCharPref("kneemail.path.filepicker");},
    set filepicker_path(v) {this.preferences.setCharPref("kneemail.path.filepicker", v);},

    get import_image_path() {return this.preferences.getCharPref("kneemail.path.import.images");},
    set import_image_path(v) {this.preferences.setCharPref("kneemail.path.import.images", v);},

    init : function ()
    {
        if (!Setup.ran_1_0_0)
        {
            Setup.run_1_0_0();
        }
    },
    
    getString : function (properties, name)
    {return Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle(properties).GetStringFromName(name);},
    
    getKneemailString : function (name)
    {return this.getString("chrome://kneemail/locale/kneemail.properties", name);},
    
    getComposeString : function (name)
    {return this.getString("chrome://kneemail/locale/compose.properties", name);},
    
    getEditPrayerPlansString : function (name)
    {return this.getString("chrome://kneemail/locale/edit_prayer_plans.properties", name);},
    
    getNewFolderString : function (name)
    {return this.getString("chrome://kneemail/locale/new_folder.properties", name);},
    
    getPrayerPlanString : function (name)
    {return this.getString("chrome://kneemail/locale/prayer_plan.properties", name);},
    
    getPreferencesString : function (name)
    {return this.getString("chrome://kneemail/locale/preferences.properties", name);}
};

// Kneemail Online RESTful object
var KneemailOnline =
{
    get isConnected() {return connected;},
    
    call: function(method, query, async, onload)
    {
        var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
        request.open("GET", Kneemail.preferences.getCharPref("kneemail.online.server") + "/pg/api/rest?method=" + method + query + "&view=json", async);
        request.onload = onload;
        request.onerror = this.error;
        request.send(null);
    },
    
    login: function()
    {
        var username = Kneemail.preferences.getCharPref("kneemail.online.username");
        var password = "";
        var address = Kneemail.preferences.getCharPref("kneemail.online.server");
        
        if (username != "")
        {
            try
            {
                var logins = Kneemail.login_manager.findLogins({}, address, address, null);
                for (var i = 0; i < logins.length; i++)
                {
                    if (logins[i].username == username)
                    {
                        password = logins[i].password;
                        break;
                    }
                }
            }
            catch(e)
            {
                Kneemail.prompts.alert(null, "Kneemail Online", e);
            }
            
            if (password != "")
            {
                this.call("kneemail_login", "&username=" + username + "&password=" + password, false, this.onlogin);
            }
            else
            {
                var pword = {value: ""};
                var check = {value: false};
                if (Kneemail.prompts.promptPassword(null, "Kneemail Online", "Enter password:", pword, "Save Password", check))
                {
                    password = pword.value;
                    if (password != "")
                    {
                        this.call("kneemail_login", "&username=" + username + "&password=" + password, false, this.onlogin);
                        
                        if (check.value)
                        {
                            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init");
                            var loginInfo = new nsLoginInfo(address, address, null, username, password, "", "");
                            Kneemail.login_manager.addLogin(loginInfo);
                        }
                    }
                    else
                    {
                        Kneemail.prompts.alert(null, "Password Required", "You must supply a password to log into Kneemail Online");
                    }
                }
            }
        }
        else
        {
            var uname = {value: ""};
            var pword = {value: ""};            
            var check = {value: false};
            
            if (Kneemail.prompts.promptUsernameAndPassword(null, "Kneemail Online", "Enter username and password:", uname, pword, "Save Username and Password", check))
            {
                username = uname.value;
                password = pword.value;
                
                if (username != "")
                {
                    Kneemail.preferences.setCharPref("kneemail.online.username", username);
                    
                    if (password != "")
                    {
                        this.call("kneemail_login", "&username=" + username + "&password=" + password, false, this.onlogin);

                        if (check.value)
                        {
                            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init");
                            var loginInfo = new nsLoginInfo(address, address, null, username, password, "", "");
                            Kneemail.login_manager.addLogin(loginInfo);
                        }
                    }
                    else
                    {
                        Kneemail.prompts.alert(null, "Password Required", "You must supply a password to log into Kneemail Online");
                    }
                }
                else
                {
                    Kneemail.prompts.alert(null, "Username Required", "You must supply a username to log into Kneemail Online");
                }
            }

        }
    },
    
    onlogin: function(e)
    {
        var response = JSON.decode(e.target.responseText);
        
        if (response.api[0].result.indexOf("Failed:") != -1)
        {
            connected = false;
            
            if( response.api[0].result.indexOf("No such user.") != -1)
            {
                Kneemail.preferences.setCharPref("kneemail.online.username", "");
            }
            else if (response.api[0].result.indexOf("Incorrect password.") != -1)
            {
                var username = Kneemail.preferences.getCharPref("kneemail.online.username");
                var address = Kneemail.preferences.getCharPref("kneemail.online.server");
                
                try
                {
                   var logins = Kneemail.login_manager.findLogins({}, address, address, null);
                
                    for (var i = 0; i < logins.length; i++)
                    {
                        if (logins[i].username == username)
                        {
                            Kneemail.login_manager.removeLogin(logins[i]);
                            break;
                        }
                    }
                }
                catch(ex)
                {}
            }
            
            Kneemail.prompts.alert(null, "Kneemail Online", response.api[0].result);
        }
        else
        {
            connected = true;
        }
    },
    
    logout: function ()
    {
        this.call("kneemail_logout", "", false, this.onlogout);
    },
    
    onlogout: function(e)
    {
        var response = JSON.decode(e.target.responseText);
        
        if (response.api[0].result.indexOf("Logout Successful.") != -1)
        {
            connected = false;
        }
    },
    
    getGroups: function ()
    {
        this.call("kneemail_groups", "", false, this.ongetgroups);
        /*var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
        request.open("GET", "http://dev.kneemailcentral.com/pg/api/rest?method=kneemail_groups&view=json", true);
        request.onload = this.ongetgroups;
        request.onerror = this.error;
        request.send(null);*/
    },
    
    ongetgroups: function (e)
    {
        // Kneemail.prompts.alert(null, "Kneemail Online", e.target.responseText);
        var groupSort =
        {
            sort: function sortAlpha(a, b)
            {
                if (a.name < b.name)
                    return -1;
                
                if (b.name < a.name)
                    return 1;
                
                return 0;
            }
        }
        
        var response = JSON.decode(e.target.responseText);
        response.api[0].result.sort(groupSort.sort);
        // Kneemail.prompts.alert(null, "Kneemail Group", response.api[0].result[0].guid);
        
        groups = new Array();
        
        for (var i=0; i<response.api[0].result.length; i++)
        {
            // Kneemail.prompts.alert(null, "Kneemail User Groups", response.api[0].result[i].name);
            
            groups[i][0] = response.api[0].result[i].guid;
            groups[i][1] = response.api[0].result[i].name;
        }
    },
    
    get groups() {return groups},
    
    error: function (e)
    {
        // Kneemail.prompts.alert(null, "Error", e.err);
    }
};

var KneemailDB =
{
    isOpen : false,
    connection : null,
    service : Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService),
    
    get lastInsertRowID()
    {
        if (this.isOpen)
            return this.connection.lastInsertRowID
        else
            return null;
    },
    
    get lastError()
    {
        return connection.lastErrorString;
    },
    
    open : function ()
    {
        if (!this.isOpen)
        {
            this.connection = this.service.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
            this.isOpen = true;
        }
    },
    
    execute : function (sql)
    {
        if (this.isOpen)
            this.connection.executeSimpleSQL(sql);
    },
    
    compact : function ()
    {
        this.execute("VACUUM");
    },
    
    statement : function (sql)
    {
        if (this.isOpen)
            return this.connection.createStatement(sql);
        else
            return null;
    },
    
    close : function ()
    {
        this.connection.close();
        this.isOpen = false;
    },
    
    getFolderTree : function (column, sort)
    {
        return new KneemailFolderTree(0, column, sort);
    },
    
    getFolder : function (id, column, sort)
    {
        return new KneemailFolder(id, column, sort);
    },
    
    getEntryTree : function (folder, column, sort)
    {
        return new KneemailEntryTree(folder, column, sort);
    },
    
    getEntry : function (id)
    {
        return new KneemailEntry(id);
    }
};

function KneemailFolderTree (parent, column, sort)
{
    this.id = 0;
    this.name = "Root";
    this.open = 0;
    this.branches = [];
    this.error = false;
    this.errorMessage = "";
    
    try
    {
        var i;
        
        if (parent > 0)
        {
            var statement = KneemailDB.statement("SELECT id, name, open FROM folders WHERE id = " + parent);
            statement.executeStep();
            
            this.id = statement.getInt64(0);
            this.name = statement.getUTF8String(1);
            this.open = statement.getInt32(2);
            
            statement.finalize();
            
            i = 0;
        }
        else
        {
            // Inactive folder
            this.branches[0] = new KneemailFolderTree(1, column, sort);
            
            // Deleted folder
            this.branches[1] = new KneemailFolderTree(2, column, sort);
            
            i = 2;
        }
        
        var strOrderBy = "";
        
        switch (Kneemail.preferences.getIntPref("kneemail.folders.sort"))
        {
            // Alphabetically
            case 0:
                strOrderBy = "name";
                break;
        
            // Created
            case 1:
                strOrderBy = "id";
                break;
            
            // Weight
            case 2:
                strOrderBy = "weight";
                break;
        }
        
        var statement = KneemailDB.statement("SELECT id, name FROM folders WHERE id > 2 AND parent = " + parent + " ORDER BY " + strOrderBy);
        
        while (statement.executeStep())
        {
            this.branches[i] = new KneemailFolderTree(statement.getInt64(0), column, sort);
            i++;
        }
    }
    catch (e)
    {
        this.error = true;
        this.errorMessage = Kneemail.getKneemailString("KNEEMAIL_DB_FOLDER_TREE_ERROR");
    }
    finally
    {
        statement.finalize();
    }
}

function KneemailFolder (id, column, sort)
{
    this.id = id;
    this.name = "";
    this.parent = 0;
    this.weight = 0;
    this.entries = [];
    this.error = false;
    this.errorMessage = "";
    
    try
    {
        
        var statement = KneemailDB.statement("SELECT name, parent, weight FROM folders WHERE id = " + id);
        
        statement.executeStep();
        
        this.name = statement.getUTF8String(0);
        this.parent = statement.getInt32(1);
        this.weight = statement.getInt32(2);
        
        statement.finalize();
        
        statement = KneemailDB.statement("SELECT id FROM entries WHERE folder = " + id + " ORDER BY status, " + column + " " + sort);
        
        var i = 0;
        while (statement.executeStep())
        {
            this.entries[i] = new KneemailEntry(statement.getInt64(0));
            i++;
        }
    }
    catch (e)
    {
        this.error = true;
        this.errorMessage = Kneemail.getKneemailString("KNEEMAIL_DB_FOLDER_ERROR");
    }
    finally
    {
        statement.finalize();
    }
    
    this.Rename = function (new_name)
    {
        if (this.id > 2)
        {
            try
            {
                KneemailDB.execute("UPDATE folders SET name = '" + new_name + "' WHERE id = " + this.id);
            }
            catch (e)
            {
                this.error = true;
                this.errorMessage = Kneemail.getKneemailString("KNEEMAIL_DB_FOLDER_RENAME_ERROR") + " " + this.name + "!";
            }
        }
    }
    
    this.Delete = function ()
    {
        if (this.id > 2)
        {
            try
            {
                // Delete the entries from the prayer plan.
                KneemailDB.execute("DELETE FROM prayerplan WHERE entry IN (SELECT id FROM entries WHERE folder = " + this.id + ")");
                // Move to Deleted Folder
                KneemailDB.execute("UPDATE folders SET parent = 2 WHERE id = " + this.id);
            }
            catch (e)
            {
                this.error = true;
                this.errorMessage = Kneemail.getKneemailString("KNEEMAIL_DB_FOLDER_DELETE_ERROR") + " " + this.name + "!";
            }
        }
    }
}

function KneemailEntryTree (folder, column, sort)
{
    this.entries = [];
    this.id = [];
    this.status = [];
    this.subject = [];
    this.created = [];
    this.modified =[];
    this.error = false;
    this.errorMessage = "";
    
    try
    {
        var statement = KneemailDB.statement("SELECT id, status, subject, created, modified FROM entries WHERE folder = " + folder + " ORDER BY status, " + column + " " + sort);
        
        var i = 0;
        while (statement.executeStep())
        {
            this.entries[i] = new KneemailEntry(statement.getInt64(0));
            this.id[i] = statement.getInt64(0);
            this.status = statement.getInt32(1);
            this.subject[i] = statement.getUTF8String(2);
            this.created[i] = statement.getInt64(3);
            this.modified[i] = statement.getInt64(4);
            i++;
        }
    }
    catch (e)
    {
        this.error = true;
        this.errorMessage = Kneemail.getKneemailString("KNEEMAIL_DB_ENTRY_ERROR");
    }
    finally
    {
        statement.finalize();
    }
}

function KneemailEntry (id)
{
    this.id = id;
    this.folder = "";
    this.type = -1;
    this.status = -1;
    this.created = 0;
    this.modified = 0;
    this.answered = 0;
    this.subject = "";
    this.entry = "";
    this.answer = "";
    this.scripture = "";
    this.images = [];
    this.error = false;
    this.errorMessage = "";
    
    try
    {        
        var statement = KneemailDB.statement("SELECT f.name, e.type, e.status, e.created, e.modified, e.answered, e.subject, e.entry, e.answer, e.scripture FROM entries e, folders f WHERE e.id = " + id + " AND f.id = e.folder");
        
        statement.executeStep();
        
        this.folder = statement.getUTF8String(0);
        this.type = statement.getInt32(1);
        this.status = statement.getInt32(2);
        this.created = statement.getInt64(3);
        this.modified = statement.getInt64(4);
        if (statement.getInt64(5) != "" && statement.getInt64(5) != null && statement.getInt64(5) > 0)
            this.answered = statement.getInt64(5);
        this.subject = statement.getUTF8String(6);
        this.entry = statement.getUTF8String(7).replace(/  /g, "&nbsp;").replace(/\r|\n|\f|\r\n/g, "<br />");
        this.answer = statement.getUTF8String(8).replace(/  /g, "&nbsp;").replace(/\r|\n|\f|\r\n/g, "<br />");
        this.scripture = statement.getUTF8String(9).replace(/  /g, "&nbsp;").replace(/\r|\n|\f|\r\n/g, "<br />");
        
        statement.finalize();
        
        statement = KneemailDB.statement("SELECT image FROM images WHERE entry = " + id);
        
        var i = 0;
        while (statement.executeStep())
        {
            this.images[i] = statement.getUTF8String(0);
            i++;
        }
    }
    catch (e)
    {
        this.error = true;
        this.errorMessage = Kneemail.getKneemailString("KNEEMAIL_DB_ENTRY_ERROR");
    }
    finally
    {
        statement.finalize();
    }
}

var Utils =
{
    DataURI : function (path)
    {
        try
        {
            var file = FileUtils.getFile(path);
            var contentType = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService).getTypeFromFile(file);
            var inputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
            inputStream.init(file, 0x01, 0600, 0);
            var stream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
            stream.setInputStream(inputStream);
            var encoded = btoa(stream.readBytes(stream.available()));
            return "data:" + contentType + ";base64," + encoded;
        }
        catch (e)
        {return e;}
    },
    
    OpenURI : function (uri)
    {
        var uriToOpen = Kneemail.io_service.newURI(uri, null, null);
        var extps = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
        extps.loadURI(uriToOpen, null);
    },
    
    ParseBool : function (v)
    {
        if (v)
            return 1;
        else
            return 0;
    },
    
    Err : function (e, js, func)
    {
        Kneemail.prompts.alert(null, Kneemail.getKneemailString("KNEEMAIL_TITLE"), e + " (" + js + " : " + func + ")");
    }
};

var DirUtils =
{
    getDir : function (path)
    {
        var dir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        dir.initWithPath(path);
        return dir;
    },
    get desktop() {return objDirService.get("Desk", Components.interfaces.nsIFile).path;},
    get home() {return objDirService.get("Home", Components.interfaces.nsIFile).path;},
    get profile() {return objDirService.get("ProfD", Components.interfaces.nsIFile).path;},
    get separator()
    {
        if (this.home.indexOf("\\") != -1)
            return "\\";
        else
            return "/";
    },
    get temp() {return objDirService.get("TmpD", Components.interfaces.nsIFile).path;}
};

var FileUtils =
{
    getFile : function (path)
    {
        var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(path);
        return file;
    }
};

// JSON
var JSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);

// BrowserOffline to toggle offline/online state\.
var BrowserOffline =
{

    toggleOfflineStatus: function ()
    {
        // Stop automatic management of the offline status
        try
        {
            Kneemail.io_service.manageOfflineStatus = false;
        }
        catch (ex)
        {}
    
        if (!Kneemail.io_service.offline && !this._canGoOffline()) {
            this._updateOfflineUI(false);
            return;
        }
    
        Kneemail.io_service.offline = !Kneemail.io_service.offline;
    
        // Save the current state for later use as the initial state
        // (if there is no netLinkService)
        Kneemail.preferences.setBoolPref("browser.offline", Kneemail.io_service.offline);
    },
    
    // nsIObserver
    observe: function (aSubject, aTopic, aState)
    {
        if (aTopic != "network:offline-status-changed")
        return;
    
        this._updateOfflineUI(aState == "offline");
    },
    
    // BrowserOffline Implementation Methods
    _canGoOffline: function ()
    {
        var os = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        if (os)
        {
            try
            {
                var cancelGoOffline = Components.classes["@mozilla.org/supports-PRBool;1"].createInstance(Components.interfaces.nsISupportsPRBool);
                os.notifyObservers(cancelGoOffline, "offline-requested", null);
                
                // Something aborted the quit process.
                if (cancelGoOffline.data)
                    return false;
            }
            catch (ex)
            {}
        }
        return true;
    },

    _uiElement: null,
    
    _updateOfflineUI: function (aOffline)
    {
        var offlineLocked = Kneemail.preferences.prefIsLocked("network.online");
        if (offlineLocked)
            this._uiElement.setAttribute("disabled", "true");
        
        this._uiElement.setAttribute("checked", aOffline);
    }
};

// Add new features to the Date object.

// Returns formatted date string
Date.prototype.toKneemailString = function ()
{
    var date = this.getFullYear();
    
    date += "-";
    
    if ((this.getMonth() + 1) < 10)
        date += "0" + (this.getMonth() + 1);
    else
        date += (this.getMonth() + 1);
        
    date += "-";
    
    if (this.getDate() < 10)
        date += "0" + this.getDate();
    else
        date += this.getDate();
    
    date += " ";
    
    var ampm = "";
    var hours = "";
    if (this.getHours() > 12)
    {
        ampm = "pm";
        if ((this.getHours() - 12) < 10)
            hours = "0" + (this.getHours() - 12);
        else
            hours = this.getHours() - 12;
    }
    else
    {
        ampm = "am";
        if (this.getHours() < 10)
            hours = "0" + this.getHours();
        else
            hours = this.getHours();
    }
    
    date += hours;
    
    date += ":";
    
    if (this.getMinutes() < 10)
        date += "0" + this.getMinutes();
    else
        date += this.getMinutes();
    
    date += ":";
    
    if (this.getSeconds() < 10)
        date += "0" + this.getSeconds();
    else
        date += this.getSeconds();
    
    date += " " + ampm;
    
    return date;
};

// Check if a year, or current year, is a leap year.
Date.prototype.isLeapYear = function (year)
{
    var date;
    if (year)
        date = new Date(year, 1, 29);
    else
        date = new Date(this.getFullYear(), 1, 29);
    return (date.getMonth() == 1);
};

// Add days, weeks, months or years to a date.
Date.prototype.add = function (interval, number)
{
    switch (interval.toLowerCase())
    {
        case "d":
            this.setDate(this.getDate() + number);
            break;
        
        case "w":
            this.setDate(this.getDate() + (number * 7));
            break;
        
        case "m":
            var day = this.getDate();
            this.setMonth(this.getMonth() + number, 28);
            switch (this.getMonth())
            {
                // January
                case 0:
                // March
                case 2:
                // May
                case 4:
                // July
                case 6:
                // August
                case 7:
                // October
                case 9:
                // December
                case 11:
                    this.setDate(day);
                    break;

                // February
                case 1:
                    if (day > 28)
                    {
                        if (this.isLeapYear())
                            this.setDate(29);
                        else
                            this.setDate(28);
                    }
                    else
                        this.setDate(day);
                    break;

                // April
                case 3:
                // June
                case 5:
                // September
                case 8:
                // November
                case 10:
                    if (day > 30)
                        this.setDate(30);
                    else
                        this.setDate(day);
                    break;
            }
            break;
        
        case "y":
            this.setFullYear(this.getFullYear() + number);
            break;
    }
    return this;
};

// Set day
Date.prototype.setDay = function (day)
{
    switch (this.getDay())
    {
        // Sun
        case 0:
            switch (day)
            {
                case 1:
                    this.add("d", 1);
                    break;

                case 2:
                    this.add("d", 2);
                    break;

                case 3:
                    this.add("d", 3);
                    break;

                case 4:
                    this.add("d", 4)
                    break;

                case 5:
                    this.add("d", 5)
                    break;

                case 6:
                    this.add("d", 6);
                    break;
            }
            break;

        // Mon
        case 1:
            switch (day)
            {
                case 2:
                    this.add("d", 1);
                    break;

                case 3:
                    this.add("d", 2);
                    break;

                case 4:
                    this.add("d", 3);
                    break;

                case 5:
                    this.add("d", 4)
                    break;

                case 6:
                    this.add("d", 5)
                    break;

                case 0:
                    this.add("d", 6);
                    break;
            }
            break;

        // Tues
        case 2:
            switch (day)
            {
                case 3:
                    this.add("d", 1);
                    break;

                case 4:
                    this.add("d", 2);
                    break;

                case 5:
                    this.add("d", 3);
                    break;

                case 6:
                    this.add("d", 4)
                    break;

                case 0:
                    this.add("d", 5)
                    break;

                case 1:
                    this.add("d", 6);
                    break;
            }
            break;

        // Wed
        case 3:
            switch (day)
            {
                case 4:
                    this.add("d", 1);
                    break;

                case 5:
                    this.add("d", 2);
                    break;

                case 6:
                    this.add("d", 3);
                    break;

                case 0:
                    this.add("d", 4)
                    break;

                case 1:
                    this.add("d", 5)
                    break;

                case 2:
                    this.add("d", 6);
                    break;
            }
            break;

        // Thurs
        case 4:
            switch (day)
            {
                case 5:
                    this.add("d", 1);
                    break;

                case 6:
                    this.add("d", 2);
                    break;

                case 0:
                    this.add("d", 3);
                    break;

                case 1:
                    this.add("d", 4)
                    break;

                case 2:
                    this.add("d", 5)
                    break;

                case 3:
                    this.add("d", 6);
                    break;
            }
            break;

        // Fri
        case 5:
            switch (day)
            {
                case 6:
                    this.add("d", 1);
                    break;

                case 0:
                    this.add("d", 2);
                    break;

                case 1:
                    this.add("d", 3);
                    break;

                case 2:
                    this.add("d", 4);
                    break;

                case 3:
                    this.add("d", 5)
                    break;

                case 4:
                    this.add("d", 6)
                    break;
            }
            break;

        // Sat
        case 6:
            switch (day)
            {
                case 0:
                    this.add("d", 1);
                    break;

                case 1:
                    this.add("d", 2);
                    break;

                case 2:
                    this.add("d", 3);
                    break;

                case 3:
                    this.add("d", 4);
                    break;

                case 4:
                    this.add("d", 5)
                    break;

                case 5:
                    this.add("d", 6)
                    break;
            }
            break;
    }
    return this;
};

// Month Add options
Date.prototype.monthAdd = function (interval, number, day)
{
    switch (interval.toLowerCase())
    {
        // Last Day of Month
        case "ldom":
            this.setMonth(this.getMonth() + number, 28);
            switch (this.getMonth())
            {
                // February
                case 1:
                    if (this.isLeapYear())
                        this.setDate(29);
                    break;

                // April
                case 3:
                // June
                case 5:
                // September
                case 8:
                // November
                case 10:
                    this.setDate(30);
                    break;

                // January
                case 0:
                // March
                case 2:
                // May
                case 4:
                // July
                case 6:
                // August
                case 7:
                // October
                case 9:
                // December
                case 11:
                    this.setDate(31);
                    break;
            }
            break;

        // First Day of Month
        case "fdom":
            this.setMonth(this.getMonth() + number, 1);
            break;

        // First Week Day of Month
        case "1wdom":
            this.monthAdd("fdom", number);
            this.setDay(day);
            break;

        // Second Week Day of Month
        case "2wdom":
            this.monthAdd("fdom", number);
            this.add("w", 1);
            this.setDay(day);
            break;

        // Third Week Day of Month
        case "3wdom":
            this.monthAdd("fdom", number);
            this.add("w", 2);
            this.setDay(day);
            break;

        // Forth Week Day of Month
        case "4wdom":
            this.monthAdd("fdom", number);
            this.add("w", 3);
            this.setDay(day);
            break;
    }
    return this;
};

// Next day of the week.
Date.prototype.nextDayofWeek = function (weekdays, number)
{
    if (number)
        this.add("w", (number - 1));
    
    switch (this.getDay())
    {
        // Sun
        case 0:
            if (weekdays[1])
                this.add("d", 1);
            else if (weekdays[2])
                this.add("d", 2);
            else if (weekdays[3])
                this.add("d", 3);
            else if (weekdays[4])
                this.add("d", 4);
            else if (weekdays[5])
                this.add("d", 5);
            else if (weekdays[6])
                this.add("d", 6);
            else if (weekdays[0])
                this.add("d", 7);
            break;
        
        // Mon
        case 1:
            if (weekdays[2])
                this.add("d", 1);
            else if (weekdays[3])
                this.add("d", 2);
            else if (weekdays[4])
                this.add("d", 3);
            else if (weekdays[5])
                this.add("d", 4);
            else if (weekdays[6])
                this.add("d", 5);
            else if (weekdays[0])
                this.add("d", 6);
            else if (weekdays[1])
                this.add("d", 7);
            break;
        
        // Tues
        case 2:
            if (weekdays[3])
                this.add("d", 1);
            else if (weekdays[4])
                this.add("d", 2);
            else if (weekdays[5])
                this.add("d", 3);
            else if (weekdays[6])
                this.add("d", 4);
            else if (weekdays[0])
                this.add("d", 5);
            else if (weekdays[1])
                this.add("d", 6);
            else if (weekdays[2])
                this.add("d", 7);
            break;
        
        // Wed
        case 3:
            if (weekdays[4])
                this.add("d", 1);
            else if (weekdays[5])
                this.add("d", 2);
            else if (weekdays[6])
                this.add("d", 3);
            else if (weekdays[0])
                this.add("d", 4);
            else if (weekdays[1])
                this.add("d", 5);
            else if (weekdays[2])
                this.add("d", 6);
            else if (weekdays[3])
                this.add("d", 7);
            break;
        
        // Thurs
        case 4:
            if (weekdays[5])
                this.add("d", 1);
            else if (weekdays[6])
                this.add("d", 2);
            else if (weekdays[0])
                this.add("d", 3);
            else if (weekdays[1])
                this.add("d", 4);
            else if (weekdays[2])
                this.add("d", 5);
            else if (weekdays[3])
                this.add("d", 6);
            else if (weekdays[4])
                this.add("d", 7);
            break;
        
        // Fri
        case 5:
            if (weekdays[6])
                this.add("d", 1);
            else if (weekdays[0])
                this.add("d", 2);
            else if (weekdays[1])
                this.add("d", 3);
            else if (weekdays[2])
                this.add("d", 4);
            else if (weekdays[3])
                this.add("d", 5);
            else if (weekdays[4])
                this.add("d", 6);
            else if (weekdays[5])
                this.add("d", 7);
            break;
        
        // Sat
        case 6:
            if (weekdays[0])
                this.add("d", 1);
            else if (weekdays[1])
                this.add("d", 2);
            else if (weekdays[2])
                this.add("d", 3);
            else if (weekdays[3])
                this.add("d", 4);
            else if (weekdays[4])
                this.add("d", 5);
            else if (weekdays[5])
                this.add("d", 6);
            else if (weekdays[6])
                this.add("d", 7);
            break;
    }
    return this;
};

var Setup =
{
    run_1_0_0 : function ()
    {
        Kneemail.preferences.setIntPref("kneemail.entries.defaulttype", 0);
        Kneemail.preferences.setCharPref("kneemail.path.kneemaildb", DirUtils.profile + DirUtils.separator);
        Kneemail.preferences.setCharPref("kneemail.path.backup", DirUtils.home + DirUtils.separator);
        Kneemail.preferences.setCharPref("kneemail.path.backup.filename", "KneemailBackup.zip");
        Kneemail.preferences.setCharPref("kneemail.path.filepicker", DirUtils.home + DirUtils.separator);
        Kneemail.preferences.setCharPref("kneemail.path.import.images", DirUtils.home + DirUtils.separator);
        Kneemail.preferences.setBoolPref("kneemail.update.startup", false);
        Kneemail.preferences.setBoolPref("kneemail.backup.shutdown", false);
        
        var file = FileUtils.getFile(DirUtils.profile + DirUtils.separator + Kneemail.database_filename);
        if (!file.exists())
        {
            try
            {
                var dbConn = Kneemail.sqlite.openDatabase(file);
    
                // Create entries table.
                dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS `entries` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL , `folder` INTEGER NOT NULL DEFAULT '0' , `type` INTEGER NOT NULL DEFAULT '0' , `status` INTEGER NOT NULL DEFAULT '0' , `created` INTEGER NOT NULL DEFAULT '' , `modified` INTEGER NOT NULL DEFAULT '' , `answered` INTEGER NOT NULL DEFAULT '' , `subject` TEXT NOT NULL DEFAULT '' , `entry` TEXT NOT NULL DEFAULT '' , `answer` TEXT NOT NULL DEFAULT '' , `scripture` TEXT NOT NULL DEFAULT '')");
                // Create errorlog table.
                dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS `errorlog` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL , `message` TEXT NOT NULL DEFAULT '' , `jsfile` TEXT NOT NULL DEFAULT '' , `function` TEXT NOT NULL DEFAULT '')");
                // Create folders table.
                dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS `folders` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL , `name` TEXT NOT NULL DEFAULT '' , `parent` INTEGER NOT NULL  DEFAULT '0' , `weight` INTEGER NOT NULL  DEFAULT '0' , `deleted` INTEGER NOT NULL  DEFAULT '0', `open` INTEGER NOT NULL  DEFAULT '0')");
                // Create images table.
                dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS `images` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL , `entry` INTEGER NOT NULL DEFAULT '0' , `image` TEXT NOT NULL  DEFAULT '', `width` INTEGER NOT NULL DEFAULT '0', `height` INTEGER NOT NULL DEFAULT '0')");
                // Create prayerplan table.
                dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS `prayerplan` (`entry` INTEGER PRIMARY KEY NOT NULL , `type` INTEGER NOT NULL  DEFAULT '0' , `nextdate` INTEGER NOT NULL DEFAULT '' , `interval` TEXT NOT NULL DEFAULT '' , `number` INTEGER NOT NULL DEFAULT '1' , `sunday` INTEGER NOT NULL  DEFAULT '0' , `monday` INTEGER NOT NULL  DEFAULT '0' , `tuesday` INTEGER NOT NULL  DEFAULT '0' , `wednesday` INTEGER NOT NULL  DEFAULT '0' , `thursday` INTEGER NOT NULL  DEFAULT '0' , `friday` INTEGER NOT NULL  DEFAULT '0' , `saturday` INTEGER NOT NULL  DEFAULT '0' , `prayerplan` INTEGER NOT NULL  DEFAULT '1')");
                // Create prayerplans table.
                dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS `prayerplans` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL , `name` TEXT NOT NULL DEFAULT '')");
        
                // Insert Inactive Folder
                dbConn.executeSimpleSQL("INSERT INTO folders (name) VALUES('" + Kneemail.getKneemailString("INACTIVE_FOLDER") + "')");
                // Insert Deleted Folder
                dbConn.executeSimpleSQL("INSERT INTO folders (name) VALUES('" + Kneemail.getKneemailString("DELETED_FOLDER") + "')");
        
                // Insert Default Parent Folders
                dbConn.executeSimpleSQL("INSERT INTO folders (name) VALUES('" + Kneemail.getKneemailString("MY_ARCHIVE") + "')");
                dbConn.executeSimpleSQL("INSERT INTO folders (name) VALUES('" + Kneemail.getKneemailString("MY_CHURCH") + "')");
                dbConn.executeSimpleSQL("INSERT INTO folders (name) VALUES('" + Kneemail.getKneemailString("MY_COMMUNITY") + "')");
                dbConn.executeSimpleSQL("INSERT INTO folders (name) VALUES('" + Kneemail.getKneemailString("MY_FAMILY") + "')");
                dbConn.executeSimpleSQL("INSERT INTO folders (name) VALUES('" + Kneemail.getKneemailString("MY_FRIENDS") + "')");
        
                // Insert default Prayer Plan
                dbConn.executeSimpleSQL("INSERT INTO prayerplans (name) VALUES('" + Kneemail.getKneemailString("DEFAULT_PRAYER_PLAN") + "')");
        
                dbConn.close();
            }
            catch(e)
            {}
        }
        else
        {}
        
        Kneemail.preferences.setBoolPref("kneemail.setup.1_0_0", true);
    },
    
    get ran_1_0_0()
    {
        try
        {
            return Kneemail.preferences.getBoolPref("kneemail.setup.1_0_0");
        }
        catch (e)
        {
            return false;
        }
    }
};