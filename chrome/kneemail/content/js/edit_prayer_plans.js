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

function OnLoad()
{
    PopulatePrayerPlan();
}

// OnInput Event for the name text box
function OnNameInput()
{
    if (document.getElementById("name").value != "")
        document.getElementById("cmd_add").disabled = false;
    else
        document.getElementById("cmd_add").disabled = true;
}

// OnCommand Event to add new Prayer Plan.
function OnCmdAdd()
{
    try
    {
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        
        // Add the Prayer Plan.
        dbConn.executeSimpleSQL("INSERT INTO prayerplans (name) VALUES('" + document.getElementById("name").value.replace(/'/g, "''") + "')");
    }
    catch (e)
    {Utils.Err(e, "edit_prayer_plans.js", "OnCmdAdd()");}
    finally
    {
        PopulatePrayerPlan();
        document.getElementById("prayer_plans").value = dbConn.lastInsertRowID;
        document.getElementById("name").focus();
        document.getElementById("name").select();
        dbConn.close();
    }
}

// OnSelect Event for the Prayer Plans list
function OnPrayerPlansListSelect()
{
    document.getElementById("cmd_rename").disabled = false;
    document.getElementById("cmd_delete").disabled = false;
}

// OnCommand Event to rename Prayer Plans
function OnCmdRename()
{
    var id = document.getElementById("prayer_plans").value;
    
    window.openDialog("chrome://kneemail/content/rename_prayer_plan.xul", "rename_prayer_plan", "modal,centerscreen", id);
    
    PopulatePrayerPlan();
    document.getElementById("prayer_plans").value = id;
}

// OnCommand Event to delete Prayer Plans.
function OnCmdDelete()
{
    if(document.getElementById("prayer_plans").value != "" && document.getElementById("prayer_plans").value != 1 && Kneemail.prompts.confirm(window, Kneemail.getEditPrayerPlansString("DELETE_TITLE"), Kneemail.getEditPrayerPlansString("DELETE_PROMPT")))
    {
        try
        {
            var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
            
            // Delete the Prayer Plan.
            dbConn.executeSimpleSQL("DELETE FROM prayerplans WHERE id = " + document.getElementById("prayer_plans").value);
            // Delete the Prayer Plan Entries.
            dbConn.executeSimpleSQL("DELETE FROM prayerplan WHERE prayerplan = " + document.getElementById("prayer_plans").value);
        }
        catch (e)
        {Utils.Err(e, "edit_prayer_plans.js", "OnCmdDelete()");}
        finally
        {
            dbConn.close();
            PopulatePrayerPlan();
            document.getElementById("name").focus();
            document.getElementById("prayer_plans").value = 1;
        }
    }
}

// Populates the Prayer Plan List Box
function PopulatePrayerPlan()
{
    var prayerplans = document.getElementById("prayer_plan_items");
    while (prayerplans.hasChildNodes())
        prayerplans.removeChild(prayerplans.firstChild);

    try
    {
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));

         // Create SELECT statement to retrieve root folders.
        var statement = dbConn.createStatement("SELECT * FROM prayerplans ORDER BY name");
        
        // Enumerate through dataset
        while (statement.executeStep())
        {
            var menuItem = document.createElement("menuitem");
            menuItem.setAttribute("value", statement.getInt64(0));
            menuItem.setAttribute("label", statement.getUTF8String(1));
            prayerplans.appendChild(menuItem);
        }
    }
    catch (e)
    {Utils.Err(e, "edit_prayer_plans.js", "PopulatePrayerPlan()");}
    finally
    {
        statement.finalize();
        dbConn.close();
    }
}