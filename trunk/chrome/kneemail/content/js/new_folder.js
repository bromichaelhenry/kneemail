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

// OnLoad Event
function OnLoad()
{
    if (window.arguments[0] == "0")
    {
        document.getElementById("root").checked = true;
        document.getElementById("root").disabled = true;
        document.getElementById("parent_name").value = Kneemail.getNewFolderString("PARENT_FOLDER") + " " + Kneemail.getNewFolderString("PARENT_ROOT");
    }
    else
    {
        document.getElementById("parent_name").value = Kneemail.getNewFolderString("PARENT_FOLDER") + " " + window.arguments[1];
    }
}

// OnClick Event for the root checkbox
function OnChkRootClick()
{
    if (!Element("root").checked)
    {
        document.getElementById("parent_name").value = Kneemail.getNewFolderString("PARENT_FOLDER") + " " + Kneemail.getNewFolderString("PARENT_ROOT");
    }
    else
    {
        document.getElementById("parent_name").value = Kneemail.getNewFolderString("PARENT_FOLDER") + " " + window.arguments[1];
    }
}

// OnDialogAccept Event
function OnAccept()
{
    if (document.getElementById("name").value != "")
    {
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        
        if (document.getElementById("root").checked)
        {
            // New Folder is a root folder.
            dbConn.executeSimpleSQL("INSERT INTO folders (name, parent, weight) VALUES('" + document.getElementById("name").value.replace(/'/g, "''") + "', 0, " + document.getElementById("weight").value + ")");
        }
        else
        {
            // New Folder is a child folder.
            dbConn.executeSimpleSQL("INSERT INTO folders (name, parent, weight) VALUES('" + document.getElementById("name").value.replace(/'/g, "''") + "', " + window.arguments[0] + ", " + document.getElementById("weight").value + ")");
        }

        // Close connection.
        dbConn.close();
    }
}