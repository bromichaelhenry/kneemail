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

var intPlan = 0;
var intPlanCount = 0;
var intPlans;

function OnLoad()
{
    if (window.arguments[0] == 0)
    {    
        intPlans = new Array();
        
        try
        {
            var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
            
            var nextDate = new Date(Date.parse(((new Date()).getMonth() + 1) + "/" + (new Date()).getDate() + "/" + (new Date()).getFullYear())).getTime();
            
            // Statement to retrieve the entry's data.
            var statement = dbConn.createStatement("SELECT DISTINCT plans.id FROM prayerplans plans, prayerplan plan WHERE plan.prayerplan = plans.id AND plan.nextdate <= " + nextDate + " ORDER BY name");
            
            var i = 0;
            
            while (statement.executeStep())
            {
                intPlans[i] = statement.getInt32(0);
                i++;
            }
            
            if (intPlans.length < 1)
            {
                // document.getElementById("cmd_forward").disabled = false;
                Kneemail.prompts.alert(null, Kneemail.getPrayerPlanString("PRAYER_PLANS_COMPLETE_TITLE"), Kneemail.getPrayerPlanString("PRAYER_PLANS_COMPLETE_PROMPT"));
                window.close();
            }
            else
            {
                ShowPrayerPlan(intPlans[intPlan]);
            }
            
            // document.getElementById("cmd_back").hidden = false;
            // document.getElementById("cmd_forward").hidden = false;
        }
        catch (e)
        {Utils.Err(e, "prayer_plan.js", "OnLoad()");}
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
        intPlans = new Array();
        ShowPrayerPlan(window.arguments[0]);
    }
    
    opener.document.getElementById("progress").setAttribute("hidden", "true");
}

// OnCommand Event for printing Prayer Plan
function OnCmdPrintPrayerPlan()
{
    window.openDialog("chrome://kneemail/content/print_prayer_plan.xul", "print_prayer_plan", "modal,centerscreen", intPlans[intPlan]);
}

// OnCommand Event for going back
function OnCmdBack()
{
    intPlan--;

    // document.getElementById("cmd_forward").disabled = false;

    if (intPlan == 0)
    {
        // document.getElementById("cmd_back").disabled = true;
    }
    
    ShowPrayerPlan(intPlans[intPlan]);
}

// OnCommand Event for going forward
function OnCmdForward()
{
    intPlan++;

    // document.getElementById("cmd_back").disabled = false;

    if (intPlan == (intPlans.length - 1))
    {
        // document.getElementById("cmd_forward").disabled = true;
    }
    
    ShowPrayerPlan(intPlans[intPlan]);
}

// OnClick Event for prayer plan items.
function OnPrayerPlanItemClick(entry)
{    
    document.getElementById("entries").removeItemAt(document.getElementById("entries").selectedIndex);
    if (document.getElementById("entries").itemCount == 0)
        document.getElementById("cmd_print").setAttribute("disabled", true);
    
    try
    {
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        var statement = dbConn.createStatement("SELECT * FROM prayerplan WHERE entry = " + entry);

        statement.executeStep();
        
        if (statement.state == 2)
        {
            var weekdays = new Array(7);
            weekdays[0] = statement.getInt32(5);
            weekdays[1] = statement.getInt32(6);
            weekdays[2] = statement.getInt32(7);
            weekdays[3] = statement.getInt32(8);
            weekdays[4] = statement.getInt32(9);
            weekdays[5] = statement.getInt32(10);
            weekdays[6] = statement.getInt32(11);
            
            var sql = "";
            var nextDate = new Date(Date.parse(((new Date()).getMonth() + 1) + "/" + (new Date()).getDate() + "/" + (new Date()).getFullYear()));
            
            switch (statement.getInt32(1))
            {
                // Daily
                case 1:
                    sql = "UPDATE prayerplan SET nextdate = " + nextDate.add("d", statement.getInt32(4)).getTime();
                    break;
                
                // Weekly
                case 2:
                    sql = "UPDATE prayerplan SET nextdate = " + nextDate.nextDayofWeek(weekdays).getTime();
                    break;
                
                // Monthly
                case 3:
                    switch (statement.getUTF8String(3))
                    {
                        // Month Add, no options.
                        case "m":
                            sql = "UPDATE prayerplan SET nextdate = " + nextDate.add(statement.getUTF8String(3), statement.getInt32(4)).getTime();
                            break;
                        
                        // Day of Month
                        case "ldom":
                        case "fdom":
                            sql = "UPDATE prayerplan SET nextdate = " + nextDate.monthAdd(statement.getUTF8String(3), statement.getInt32(4)).getTime();
                            break;
                        
                        case "1wdom":
                        case "2wdom":
                        case "3wdom":
                        case "4wdom":
                            if (weekdays[0])
                                sql = "UPDATE prayerplan SET nextdate = " + nextDate.monthAdd(statement.getUTF8String(3), statement.getInt32(4), 0).getTime();
                            else if (weekdays[1])
                                sql = "UPDATE prayerplan SET nextdate = " + nextDate.monthAdd(statement.getUTF8String(3), statement.getInt32(4), 1).getTime();
                            else if (weekdays[2])
                                sql = "UPDATE prayerplan SET nextdate = " + nextDate.monthAdd(statement.getUTF8String(3), statement.getInt32(4), 2).getTime();
                            else if (weekdays[3])
                                sql = "UPDATE prayerplan SET nextdate = " + nextDate.monthAdd(statement.getUTF8String(3), statement.getInt32(4), 3).getTime();
                            else if (weekdays[4])
                                sql = "UPDATE prayerplan SET nextdate = " + nextDate.monthAdd(statement.getUTF8String(3), statement.getInt32(4), 4).getTime();
                            else if (weekdays[5])
                                sql = "UPDATE prayerplan SET nextdate = " + nextDate.monthAdd(statement.getUTF8String(3), statement.getInt32(4), 5).getTime();
                            else if (weekdays[6])
                                sql = "UPDATE prayerplan SET nextdate = " + nextDate.monthAdd(statement.getUTF8String(3), statement.getInt32(4), 6).getTime();
                            break;
                    }
                    break;
                
                // Yearly
                case 4:
                    sql = "UPDATE prayerplan SET nextdate = " + nextDate.add("y", statement.getInt32(4)).getTime();
                    break;
                
                // Once
                case 5:
                    sql = "DELETE FROM prayerplan";
                    break;
            }
            
            dbConn.executeSimpleSQL(sql + " WHERE entry = " + entry);
        }
    }
    catch (e)
    {Utils.Err(e, "prayer_plan.js", "OnPrayerPlanItemClick()");}
    finally
    {
        // Finalize statement.
        statement.finalize();
        // Close connection.
        dbConn.close();
        
        intPlanCount--;
        if (intPlanCount == 0)
        {
            intPlan++;
            if (intPlan != intPlans.length)
            {
                ShowPrayerPlan(intPlans[intPlan]);
            }
            else
            {
                Kneemail.prompts.alert(null, Kneemail.getPrayerPlanString("PRAYER_PLANS_COMPLETE_TITLE"), Kneemail.getPrayerPlanString("PRAYER_PLANS_COMPLETE_PROMPT"));
                window.close();
            }
        }
    }
}

//OnDblClick Event for the Items
function OnEntriesDblClick(entry)
{
    var strArrayEntryFolder = entry.split(":");
    EditEntry(parseInt(strArrayEntryFolder[0]), parseInt(strArrayEntryFolder[1]), "Edit");
}

// Shows the Prayer Plan given its id
function ShowPrayerPlan(id)
{
    try
    {
        document.getElementById("entries_number").value = Kneemail.getPrayerPlanString("NUMBER_ENTRIES") + " ";
        
        // Clear All Children
        var listchildren = document.getElementById("entries");
        while(listchildren.hasChildNodes())
            listchildren.removeChild(listchildren.firstChild);
            
        listchildren.scrollTop = 0;

        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        // Statement to retrieve the entry's data.
        var statement = dbConn.createStatement("SELECT name FROM prayerplans WHERE id = " + id);

        statement.executeStep();
        document.title = Kneemail.getPrayerPlanString("TODAYS_PRAYER_PLAN") + " " + Kneemail.getPrayerPlanString("FOR") + " " + statement.getUTF8String(0);
        statement.finalize();
        
        var i = 0;
        
        statement = dbConn.createStatement("SELECT e.*, f.name, ps.name FROM entries e, prayerplan p, prayerplans ps, folders f WHERE p.nextdate <= " + (new Date(Date.parse(((new Date()).getMonth() + 1) + "/" + (new Date()).getDate() + "/" + (new Date()).getFullYear()))).getTime() + " AND p.entry = e.id AND p.prayerplan = '" + id + "' AND ps.id = p.prayerplan AND f.id = e.folder ORDER BY e.created DESC");
        
        while (statement.executeStep())
        {
            i++;
            var lstEntryItem = document.createElement("richlistitem");
            lstEntryItem.setAttribute("style", "border-bottom: solid 1px black;");
            lstEntryItem.orient = "vertical";
            lstEntryItem.value = statement.getInt32(0) + ":" + statement.getInt32(1);
            
            var checkbox = document.createElement("checkbox");
            checkbox.setAttribute("onclick", "OnPrayerPlanItemClick(" + statement.getInt32(0) + ");")
            
            var checkspacer = document.createElement("spacer");
            checkspacer.setAttribute("flex", "1");
            
            var boxCheckbox = document.createElement("vbox");
            boxCheckbox.appendChild(checkbox);
            boxCheckbox.appendChild(checkspacer);
            
            var image = document.createElement("image");
            var imagespacer = document.createElement("spacer");
            imagespacer.setAttribute("flex", "1");

            switch (statement.getInt32(3))
            {
                case 0:
                    image.setAttribute("src", "chrome://kneemail/skin/images/entry.png");
                    break;
                
                case 1:
                    image.setAttribute("src", "chrome://kneemail/skin/images/entry_answered.png");
                    break;
                
                case 2:
                    image.setAttribute("src", "chrome://kneemail/skin/images/entry_inactive.png");
                    break;
            }
            
            var boxStatus = document.createElement("vbox");
            boxStatus.appendChild(image);
            boxStatus.appendChild(imagespacer);
            
            var subject = document.createElement("description");
            subject.appendChild(document.createTextNode(i + ") " + statement.getUTF8String(7) + " (" + statement.getUTF8String(11) + ")"));
            subject.setAttribute("class", "header");
            subject.setAttribute("style", "width: 695px;");
            
            var entryText = document.createElement("description");
            entryText.appendChild(document.createTextNode("Entry: "));
            entryText.setAttribute("class", "header");
            
            var entry = document.createElement("description");
            entry.setAttribute("style", "width: 695px; white-space: pre-wrap;");
            entry.appendChild(document.createTextNode(statement.getUTF8String(8)));
            
            var boxEntry = document.createElement("vbox");
            boxEntry.setAttribute("flex", "1");
            boxEntry.appendChild(subject);
            boxEntry.appendChild(entryText);
            boxEntry.appendChild(entry);

            if(statement.getInt32(2) == 0 && statement.getUTF8String(9) != "")
            {
                var entryAnswer = document.createElement("description");
                entryAnswer.appendChild(document.createTextNode("Answer: "));
                entryAnswer.setAttribute("class", "header");
                
                var answer = document.createElement("description");
                answer.setAttribute("style", "width: 695px; white-space: pre-wrap;");
                answer.appendChild(document.createTextNode(statement.getUTF8String(9)));
                
                boxEntry.appendChild(entryAnswer);
                boxEntry.appendChild(answer);
            }

            if(statement.getUTF8String(10) != "")
            {
                var entryScripture = document.createElement("description");
                entryScripture.appendChild(document.createTextNode("Scripture: "));
                entryScripture.setAttribute("class", "header");
                
                var scripture = document.createElement("description");
                scripture.setAttribute("style", "width: 695px; white-space: pre-wrap;");
                scripture.appendChild(document.createTextNode(statement.getUTF8String(10)));
                
                boxEntry.appendChild(entryScripture);
                boxEntry.appendChild(scripture);
            }

            var boxItem = document.createElement("hbox");
            boxItem.appendChild(boxCheckbox);
            boxItem.appendChild(boxStatus);
            boxItem.appendChild(boxEntry);
            
            var boxImages = document.createElement("vbox");
            
            var imgStatement = dbConn.createStatement("SELECT image, width, height FROM images WHERE entry = " + statement.getInt32(0));
            while (imgStatement.executeStep())
            {
                var boxImg = document.createElement("box");
                var img = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
                img.src = imgStatement.getUTF8String(0);
                boxImg.appendChild(img);
                boxImages.appendChild(boxImg);
            }
            imgStatement.finalize();
            
            boxItem.appendChild(boxImages);
            
            lstEntryItem.appendChild(boxItem);
            
            document.getElementById("entries").appendChild(lstEntryItem);
        }
        
        if (i == 0)
        {
            document.getElementById("cmd_print").setAttribute("disabled", true);
            
            if (intPlan != intPlans.length)
            {
                intPlan++;
                ShowPrayerPlan(intPlans[intPlan]);
            }
            else
            {
                // Kneemail.prompts.alert(null, Kneemail.getPrayerPlanString("NO_ENTRIES_TITLE"), Kneemail.getPrayerPlanString("NO_ENTRIES_PROMPT"));
                // Kneemail.prompts.alert(null, Kneemail.getPrayerPlanString("PRAYER_PLANS_COMPLETE_TITLE"), Kneemail.getPrayerPlanString("PRAYER_PLANS_COMPLETE_PROMPT"));
                // window.close();
            }
        }
        else
        {
            document.getElementById("cmd_print").removeAttribute("disabled");
        }
    }
    catch (e)
    {
        Utils.Err(e, "prayer_plan.js", "ShowPrayerPlan()");
        // Kneemail.prompts.alert(null, Kneemail.getPrayerPlanString("PRAYER_PLANS_COMPLETE_TITLE"), Kneemail.getPrayerPlanString("PRAYER_PLANS_COMPLETE_PROMPT"));
        window.close();
    }
    finally
    {
        // Finalize statement.
        statement.finalize();    
        // Close connection.
        dbConn.close();

        document.getElementById("entries_number").value += i;
        intPlanCount = i;
    }
}

// Opens the compose screen to edit the entry.
function EditEntry(entry, folder, action)
{
    window.openDialog("chrome://kneemail/content/compose.xul", "compose", "modal,centerscreen", entry, folder, action);
}