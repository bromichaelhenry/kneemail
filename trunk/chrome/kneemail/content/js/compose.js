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

Components.utils.import("resource://kneemail/kneemail.jsm");

var intEntryId = parseInt(window.arguments[0]);
var intImageId = 0;
var arrayNewImages = new Array(0);
var arrayNewImagesWidth = new Array(0);
var arrayNewImagesHeight = new Array(0);
var strHelpTopic ="new_entry";

// OnLoad Event
function OnLoad()
{
    document.getElementById("type").selectedIndex = Kneemail.preferences.getIntPref("kneemail.entries.defaulttype");

    if (intEntryId > 0)
    {
        strHelpTopic = "edit_entry";
        
        try
        {
            var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
            // Statement to retrieve the entry's data.
            var statement = dbConn.createStatement("SELECT type, status, created, modified, answered, subject, entry, answer, scripture FROM entries WHERE id = " + intEntryId);
            
            statement.executeStep();
            document.getElementById("type").selectedIndex = statement.getInt32(0);
            document.getElementById("status").selectedIndex = statement.getInt32(1);
            document.getElementById("created").value = (new Date(statement.getInt64(2))).toKneemailString();
            document.getElementById("created_box").hidden = false;
            document.getElementById("modified").value = (new Date(statement.getInt64(3))).toKneemailString();
            document.getElementById("modified_box").hidden = false;
            if (statement.getInt64(4) != "null" && statement.getInt64(4) != 0)
            {
                document.getElementById("answered").value = (new Date(statement.getInt64(4))).toKneemailString();
            }
            else
            {
                document.getElementById("answered_box").hidden = true;
            }
            
            document.getElementById("subject").value = statement.getUTF8String(5);
            
            document.getElementById("entry").value = statement.getUTF8String(6);
            
            if (statement.getUTF8String(7) != "null")
            {
                document.getElementById("answer").value = statement.getUTF8String(7);
            }
                
            document.getElementById("scripture").value = statement.getUTF8String(8);
            
            document.title = Kneemail.getComposeString("COMPOSE_TITLE") + " (" + statement.getUTF8String(5) + ")";
            
            if (window.arguments[2] == "Answered")
            {
                document.getElementById("answer").focus();
                document.getElementById("status").selectedIndex = 1;
            }
            
            statement.finalize();
            
            statement = dbConn.createStatement("SELECT id, image FROM images WHERE entry = " + intEntryId);
            while (statement.executeStep())
            {
                ShowImage(statement.getInt32(0), statement.getUTF8String(1));
            }
            
            document.getElementById("cmd_prayer_plan").removeAttribute("disabled");
        }
        catch (e)
        {Utils.Err(e, "compose.js", "OnLoad()");}
        finally
        {
            // Finalize statement.
            statement.finalize();
            // Close connection.
            dbConn.close();
        }
    }
    else
    {
        document.getElementById("created_box").hidden = true;
        document.getElementById("modified_box").hidden = true;
        document.getElementById("answered_box").hidden = true;
    }
    
    DisableSave();
}

// OnCommand Event for adding images
function OnCmdAddImage()
{
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, Kneemail.getComposeString("ADD_IMAGE"), nsIFilePicker.modeOpen);
    fp.displayDirectory = DirUtils.getDir(Kneemail.import_image_path);
    fp.appendFilter("Image Files", "*.gif; *.jpg; *.png; *.GIF; *.JPG; *.PNG");
    var r = fp.show();
    if (r == nsIFilePicker.returnOK)
    {
        var width_height = 400;
        var img = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
        img.setAttribute("style", "min-width: 1px; min-height: 1px; width: " + width_height + "px; height: auto;");
        img.onload = function ()
        {
            var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
            canvas.width = canvas.height = width_height;
            var ctx = canvas.getContext("2d");
            
            var ratio = ((img.width / img.height) + "").substring(0,3);
            var x;
            var y;
            var height;
            var width;
            if (img.width >= img.height)
            {
                width = width_height;
                height = width * img.height / img.width;
                
                if (img.width < width_height)
                {
                    x = (width_height / 2) - (img.width / 2);
                    width = img.width;
                }
                else
                    x = 0;
                
                if (img.height < width_height)
                {
                    y = (width_height / 2) - (img.height / 2);
                    height = img.height;
                }
                else
                    y = 0;

                canvas.width = width;
                canvas.height = height;
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
            }
            else
            {
                height = width_height;
                width = height * img.width / img.height;
                
                if (img.width < width_height)
                {
                    x = (width_height / 2) - (img.width / 2);
                    width = img.width;
                }
                else
                    x = 0;
                
                if (img.height < width_height)
                {
                    y = (width_height / 2) - (img.height / 2);
                    height = img.height;
                }
                else
                    y = 0;

                canvas.width = width;
                canvas.height = height;
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
            }
            
            arrayNewImages[arrayNewImages.length] = canvas.toDataURL("image/jpeg");
            arrayNewImagesWidth[arrayNewImagesWidth.length] = width;
            arrayNewImagesHeight[arrayNewImagesHeight.length] = height;
            ShowImage("New " + (arrayNewImages.length - 1), arrayNewImages[arrayNewImages.length - 1]);
            document.getElementById("cmd_delete_image").setAttribute("disabled", "true");
            EnableSave();
        }
        img.src = Utils.DataURI(fp.file.path);
        
        Kneemail.import_image_path = fp.file.path.substring(0, fp.file.path.indexOf(fp.file.leafName));
    }
}

// OnCommand event to delete images
function OnCmdDeleteImage()
{
    try
    {
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        
        if(intImageId.indexOf("New") == -1)
            dbConn.executeSimpleSQL("DELETE FROM images WHERE id = " + intImageId);
        
        document.getElementById("images_box").removeChild(document.getElementById(intImageId));
        
        document.getElementById("cmd_delete_image").setAttribute("disabled", "true");
    }
    catch (e)
    {Utils.Err(e, "compose.js", "OnCmdDeleteImage()");}
    finally
    {
        dbConn.close();
    }
}

// OnSelect Event for the type menulist.
function OnListTypeSelect()
{
    switch (document.getElementById("type").selectedIndex)
    {
        case 0:
            document.getElementById("answer_box").hidden = false;
            document.getElementById("answered_box").hidden = false;
            break;
        
        case 1:
            document.getElementById("answer_box").hidden = true;
            document.getElementById("answered_box").hidden = true;
            document.getElementById("answer").value = "";
            break;
        
        case 2:
            document.getElementById("answer_box").hidden = true;
            document.getElementById("answered_box").hidden = true;
            document.getElementById("answer").value = "";
            break;
    }
    
    EnableSave();
}

// OnSelect Event for the status menulist.
function OnListStatusSelect()
{
    switch (document.getElementById("status").selectedIndex)
    {
        case 1:
            document.getElementById("answer_box").hidden = false;
            document.getElementById("answered_box").hidden = false;
            document.getElementById("answer").focus();
            break;
        
        default:
            document.getElementById("answered_box").hidden = true;
    }
    
    EnableSave();
}

// "OnPrayerPlan" Event
function OnPrayerPlan()
{
    window.openDialog("chrome://kneemail/content/edit_entry_prayer_plan.xul", "entry_prayer_plan", "modal,centerscreen", intEntryId);
}

function OnSave()
{
    try
    {
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        
        if (intEntryId > 0)
        {
            var inactive = false;
            // Update existing entry.
            var type = document.getElementById("type").selectedIndex;
            var status = document.getElementById("status").selectedIndex;
            var modified = Date.now();
            var subject = document.getElementById("subject").value.replace(/'/g, "''");
            var entry = document.getElementById("entry").value.replace(/'/g, "''");
            var answered = 0;
            var answer = document.getElementById("answer").value.replace(/'/g, "''");
            var scripture = document.getElementById("scripture").value;

            if (answer != "")
            {
                type = 0;
                document.getElementById("type").selectedIndex = type;
                
                if (status != 2)
                {
                    status = 1;
                    document.getElementById("status").selectedIndex = status;
                }
                else
                {
                    dbConn.executeSimpleSQL("DELETE FROM prayerplan WHERE entry = " + intEntryId);
                    inactive = true;
                }

                answered = Date.now();
                document.getElementById("answered").value = (new Date(answered)).toKneemailString();
                
                // Update the entry.
                if (inactive)
                    dbConn.executeSimpleSQL("UPDATE entries SET folder = 1, type = " + type + ", status = " + status + ", modified = " + modified + ", answered = " + answered + ", subject = '" + subject + "', entry = '" + entry + "', answer = '" + answer + "', scripture = '" + scripture + "' WHERE id = " + intEntryId);
                else
                    dbConn.executeSimpleSQL("UPDATE entries SET type = " + type + ", status = " + status + ", modified = " + modified + ", answered = " + answered + ", subject = '" + subject + "', entry = '" + entry + "', answer = '" + answer + "', scripture = '" + scripture + "' WHERE id = " + intEntryId);
            }
            else
            {
                if (status == 1)
                {
                    status = 0;
                    document.getElementById("status").selectedIndex = status;
                }
                else if (status == 2)
                {
                    dbConn.executeSimpleSQL("DELETE FROM prayerplan WHERE entry = " + intEntryId);
                    inactive = true;
                }    
                
                document.getElementById("answered").value = "";

                // Update the entry.
                if (inactive)
                    dbConn.executeSimpleSQL("UPDATE entries SET folder = 1, type = " + type + ", status = " + status + ", modified = " + modified + ", answered = 0, subject = '" + subject + "', entry = '" + entry + "', answer = '', scripture = '" + scripture + "' WHERE id = " + intEntryId);
                else
                    dbConn.executeSimpleSQL("UPDATE entries SET type = " + type + ", status = " + status + ", modified = " + modified + ", answered = 0, subject = '" + subject + "', entry = '" + entry + "', answer = '', scripture = '" + scripture + "' WHERE id = " + intEntryId);
            }
            document.getElementById("modified").value = (new Date(modified)).toKneemailString();
            
            for (var i = 0; i < arrayNewImages.length; i++)
            {
                dbConn.executeSimpleSQL("INSERT INTO images (entry, image, width, height) VALUES(" + intEntryId + ", '" + arrayNewImages[i] + "', " + arrayNewImagesWidth[i] + ", " + arrayNewImagesHeight[i] + ")");
                document.getElementById("New " + i).setAttribute("id", dbConn.lastInsertRowID);
            }
                
            arrayNewImages = new Array();
            
            DisableSave();
        }
        else
        {
            // Create new entry.
            var folder = parseInt(window.arguments[1]);
            var type = document.getElementById("type").selectedIndex;
            var status = document.getElementById("status").selectedIndex;
            var created = Date.now();
            var modified = Date.now();
            var subject = document.getElementById("subject").value.replace(/'/g, "''");
            var entry = document.getElementById("entry").value.replace(/'/g, "''");
            var answered = 0;
            var answer = document.getElementById("answer").value.replace(/'/g, "''");
            var scripture = document.getElementById("scripture").value;
            
            document.getElementById("created_box").hidden = false;
            document.getElementById("modified_box").hidden = false;
            
            if (answer != "")
            {
                type = 0;
                document.getElementById("type").selectedIndex = type;
                
                if (status != 2)
                {
                    status = 1;
                    document.getElementById("status").selectedIndex = status;
                }
                else
                    folder = 1;
                    
                answered = Date.now();
                document.getElementById("answered").value = (new Date(answered)).toKneemailString();
                document.getElementById("answered_box").hidden = false;
            }
            else
            {
                if (status != 2)
                {
                    status = 0;
                    document.getElementById("status").selectedIndex = status;
                }
                else
                    folder = 1;
                    
                answer = "";
                document.getElementById("answered").value = "";
            }

            dbConn.executeSimpleSQL("INSERT INTO entries (folder, type, status, created, modified, answered, subject, entry, answer, scripture) VALUES(" + folder + ", " + type + ", " + status + ", " + created + ", " + modified + ", " + answered + ", '" + subject + "', '" + entry + "', '" + answer + "', '" + scripture + "')");
            
            document.getElementById("created").value = (new Date(created)).toKneemailString();
            document.getElementById("modified").value = (new Date(modified)).toKneemailString();
            
            intEntryId = dbConn.lastInsertRowID;
            
            for (var i = 0; i < arrayNewImages.length; i++)
            {
                dbConn.executeSimpleSQL("INSERT INTO images (entry, image) VALUES(" + intEntryId + ", '" + arrayNewImages[i] + "')");
                document.getElementById("New " + i).setAttribute("id", dbConn.lastInsertRowID);
            }
                
            arrayNewImages = new Array();
            
            document.getElementById("cmd_prayer_plan").removeAttribute("disabled");
            DisableSave();
        }
    }
    catch (e)
    {Utils.Err(e, "compose.js", "OnCmdSave()");}
    finally
    {
        // Close connection.
        dbConn.close();
    }
}

// "OnClose" Event
function OnClose()
{
    window.close();
}

// Updates the titlebar of the Compose screen
function UpdateTitlebar(showStar)
{
    if(document.getElementById("subject").value != "")
    {
        document.title = Kneemail.getComposeString("COMPOSE_TITLE") + " (" + document.getElementById("subject").value + ")";
    }
    else
    {
        document.title = Kneemail.getComposeString("COMPOSE_TITLE") + " (" + Kneemail.getComposeString("COMPOSE_NO_SUBJECT") + ")";
    }
    
    if (showStar) document.title += "*";
}

// Shows an image associated with the entry
function ShowImage(id, url)
{
    var img = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
    img.setAttribute("id", id);
    img.setAttribute("style", "min-width: 1px; min-height: 1px; width: 206px; height: auto; border: solid 3px black;");
    img.onmouseover = function ()
    {
        if (intImageId != this.id)
            this.setAttribute("style", "min-width: 1px; min-height: 1px; width: 206px; height: auto; border: solid 3px blue;");
    }
    img.onmouseout = function ()
    {
        if (intImageId != this.id)
            this.setAttribute("style", "min-width: 1px; min-height: 1px; width: 206px; height: auto; border: solid 3px black;");
    }
    img.onclick = function ()
    {
        if (this.id.indexOf("New") == -1)
            document.getElementById("cmd_delete_image").removeAttribute("disabled");
        else
            document.getElementById("cmd_delete_image").setAttribute("disabled", "true");

        intImageId = this.id;
        
        var imgs = document.getElementById("images_box").childNodes;
        for (var i in imgs)
        {
            if (intImageId != imgs[i].id)
                imgs[i].setAttribute("style", "min-width: 1px; min-height: 1px; width: 206px; height: auto; border: solid 3px black;");
            else
                imgs[i].setAttribute("style", "min-width: 1px; min-height: 1px; width: 206px; height: auto; border: dotted 3px red;");
        }
    }
    img.src = url;
    document.getElementById("images_box").appendChild(img);
}

// Sets the "Save" button to enabled and changes the titlebar to reflect this with an "*"
function EnableSave()
{
    UpdateTitlebar(true);
    document.getElementById("cmd_save").removeAttribute("disabled");
}

// Sets the "Save" button to disabled and changes the titlebar to reflect this
function DisableSave()
{
    UpdateTitlebar(false);
    document.getElementById("cmd_save").setAttribute("disabled", "true");
}