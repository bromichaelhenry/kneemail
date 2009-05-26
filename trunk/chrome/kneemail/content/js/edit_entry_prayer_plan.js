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

var blnInPlan;
var strDay = "Sun";

function OnLoad()
{
    var date = (new Date(Date.parse(((new Date()).getMonth() + 1) + "/" + (new Date()).getDate() + "/" + (new Date()).getFullYear()))).getTime();
    
    document.getElementById("days_starting").dateValue = new Date(date);
    document.getElementById("weeks_starting").dateValue = new Date(date);
    document.getElementById("months_starting").dateValue = new Date(date);
    document.getElementById("years_starting").dateValue = new Date(date);
    document.getElementById("once_day").dateValue = new Date(date);
    
    if (parseInt(window.arguments[0]) > 0)
    {
        try
        {
            PopulatePrayerPlans();
            
            var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
            // Statement to retrieve the entry's data.
            var statement = dbConn.createStatement("SELECT * FROM prayerplan WHERE entry = " + window.arguments[0]);
            
            statement.executeStep();
            
            // Type
            document.getElementById("type").selectedIndex = statement.getInt32(1);
            document.getElementById("deck").selectedIndex = statement.getInt32(1);
            
            // NextDate
            document.getElementById("days_starting").dateValue = new Date(statement.getInt64(2));
            document.getElementById("weeks_starting").dateValue = new Date(statement.getInt64(2));
            document.getElementById("months_starting").dateValue = new Date(statement.getInt64(2));
            document.getElementById("years_starting").dateValue = new Date(statement.getInt64(2));
            document.getElementById("once_day").dateValue = new Date(statement.getInt64(2));

            // Month Interval
            if (statement.getUTF8String(3) != "d" && statement.getUTF8String(3) != "w" && statement.getUTF8String(3) != "y")
                document.getElementById("month_add").value = statement.getUTF8String(3);
            
            // Number
            document.getElementById("days").value = statement.getInt32(4);
            document.getElementById("weeks").value = statement.getInt32(4);
            document.getElementById("months").value = statement.getInt32(4);
            document.getElementById("years").value = statement.getInt32(4);
            
            // Week Days
            document.getElementById("weeks_sunday").checked = statement.getInt32(5);
            document.getElementById("weeks_monday").checked = statement.getInt32(6);
            document.getElementById("weeks_tuesday").checked = statement.getInt32(7);
            document.getElementById("weeks_wednesday").checked = statement.getInt32(8);
            document.getElementById("weeks_thursday").checked = statement.getInt32(9);
            document.getElementById("weeks_friday").checked = statement.getInt32(10);
            document.getElementById("weeks_saturday").checked = statement.getInt32(11);
            
            // Week Day for Month.
            if (statement.getInt32(5))
            {
               document.getElementById("month_day").value = "Sun"; 
            }
            else if (statement.getInt32(6))
            {
                document.getElementById("month_day").value = "Mon"; 
            }
            else if (statement.getInt32(7))
            {
                document.getElementById("month_day").value = "Tues";
            }
            else if (statement.getInt32(8))
            {
                document.getElementById("month_day").value = "Wed";
            }
            else if (statement.getInt32(9))
            {
                document.getElementById("month_day").value = "Thurs";
            }
            else if (statement.getInt32(10))
            {
                document.getElementById("month_day").value = "Fri";
            }
            else if (statement.getInt32(11))
            {
                document.getElementById("month_day").value = "Sat";
            }
            
            document.getElementById("prayer_plans").value = statement.getInt64(12);
            
            blnInPlan = true;
        }
        catch (e)
        {blnInPlan = false;}
        finally
        {
            // Finalize statement.
            statement.finalize();
            // Close connection.
            dbConn.close();
            
            if (!blnInPlan)
                document.getElementById("prayer_plans").value = 1;
        }
    }
    else
    {
        window.close();
    }
}

// OnClick Event for the type radio group.
function OnTypeClick(index)
{
    document.getElementById("deck").selectedIndex = index;
}

// OnClick Event for the day radio group.
function OnDayClick(day)
{
    strDay = day;
}

// OnSelect Event for the month options.
function OnCboMonthAddSelect(selected)
{
    switch (selected)
    {
        case "m":
        case "dom":
        case "ldom":
        case "fdom":
            document.getElementById("month_days").setAttribute("hidden", "true");
            break;
        
        case "1wdom":
        case "2wdom":
        case "3wdom":
        case "4wdom":
            document.getElementById("month_days").removeAttribute("hidden");
            break;
    }
}
// OnAccept Event of the dialog.
function OnAccept()
{
    var dailyDate = (new Date(Date.parse((document.getElementById("days_starting").month + 1) + "/" + document.getElementById("days_starting").date + "/" + document.getElementById("days_starting").year))).getTime();
    var weeklyDate = (new Date(Date.parse((document.getElementById("weeks_starting").month + 1) + "/" + document.getElementById("weeks_starting").date + "/" + document.getElementById("weeks_starting").year))).getTime();
    var monthlyDate = (new Date(Date.parse((document.getElementById("months_starting").month + 1) + "/" + document.getElementById("months_starting").date + "/" + document.getElementById("months_starting").year))).getTime();
    var yearlyDate = (new Date(Date.parse((document.getElementById("years_starting").month + 1) + "/" + document.getElementById("years_starting").date + "/" + document.getElementById("years_starting").year))).getTime();
    var onceDate = (new Date(Date.parse((document.getElementById("once_day").month + 1) + "/" + document.getElementById("once_day").date + "/" + document.getElementById("once_day").year))).getTime();
    
    if (blnInPlan)
    {
        try
        {
            var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
            
            var strSQL = "";
            
            switch (parseInt(document.getElementById("type").value))
            {
                // None
                case 0:
                    strSQL = "DELETE FROM prayerplan";
                    break;
                
                // Daily
                case 1:
                    strSQL = "UPDATE prayerplan SET type = " + document.getElementById("type").value + ", nextdate = " + dailyDate + ", interval = 'd', number = " + document.getElementById("days").value + ", sunday = 0, monday = 0, tuesday = 0, wednesday = 0, thursday = 0, friday = 0, saturday = 0, prayerplan = " + document.getElementById("prayer_plans").value;
                    break;
                
                // Weekly
                case 2:
                    strSQL = "UPDATE prayerplan SET type = " + document.getElementById("type").value + ", nextdate = " + weeklyDate + ", interval = 'w', number = " + document.getElementById("weeks").value + ", sunday = " + Utils.ParseBool(document.getElementById("weeks_sunday").checked) + ", monday = " + Utils.ParseBool(document.getElementById("weeks_monday").checked) + ", tuesday = " + Utils.ParseBool(document.getElementById("weeks_tuesday").checked) + ", wednesday = " + Utils.ParseBool(document.getElementById("weeks_wednesday").checked) + ", thursday = " + Utils.ParseBool(document.getElementById("weeks_thursday").checked) + ", friday = " + Utils.ParseBool(document.getElementById("weeks_friday").checked) + ", saturday = " + Utils.ParseBool(document.getElementById("weeks_saturday").checked) + ", prayerplan = " + document.getElementById("prayer_plans").value;
                    break;
                
                // Monthly
                case 3:
                    strSQL = "UPDATE prayerplan SET type = " + document.getElementById("type").value + ", nextdate = " + monthlyDate + ", interval = '" + document.getElementById("month_add").selectedItem.value + "', number = " + document.getElementById("months").value;
                    switch (strDay)
                    {
                        case "Sun":
                            strSQL  += ", sunday = 1, monday = 0, tuesday = 0, wednesday = 0, thursday = 0, friday = 0, saturday = 0";
                            break;
                        
                        case "Mon":
                            strSQL  += ", sunday = 0, monday = 1, tuesday = 0, wednesday = 0, thursday = 0, friday = 0, saturday = 0";
                            break;
                        
                        case "Tues":
                            strSQL  += ", sunday = 0, monday = 0, tuesday = 1, wednesday = 0, thursday = 0, friday = 0, saturday = 0";
                            break;
                        
                        case "Wed":
                            strSQL  += ", sunday = 0, monday = 0, tuesday = 0, wednesday = 1, thursday = 0, friday = 0, saturday = 0";
                            break;
                        
                        case "Thurs":
                            strSQL  += ", sunday = 0, monday = 0, tuesday = 0, wednesday = 0, thursday = 1, friday = 0, saturday = 0";
                            break;
                        
                        case "Fri":
                            strSQL  += ", sunday = 0, monday = 0, tuesday = 0, wednesday = 0, thursday = 0, friday = 1, saturday = 0";
                            break;
                        
                        case "Sat":
                            strSQL  += ", sunday = 0, monday = 0, tuesday = 0, wednesday = 0, thursday = 0, friday = 0, saturday = 1";
                            break;
                    }
                    strSQL += ", prayerplan = " + document.getElementById("prayer_plans").value;
                    break;
                
                // Yearly
                case 4:
                    strSQL = "UPDATE prayerplan SET type = " + document.getElementById("type").value + ", nextdate = " + yearlyDate + ", interval = 'y', number = " + document.getElementById("years").value + ", sunday = 0, monday = 0, tuesday = 0, wednesday = 0, thursday = 0, friday = 0, saturday = 0, prayerplan = " + document.getElementById("prayer_plans").value;
                    break;
                
                // Once
                case 5:
                    strSQL = "UPDATE prayerplan SET type = " + document.getElementById("type").value + ", nextdate = " + onceDate + ", interval = '', number = 0, sunday = 0, monday = 0, tuesday = 0, wednesday = 0, thursday = 0, friday = 0, saturday = 0, prayerplan = " + document.getElementById("prayer_plans").value;
                    break;
            }

            dbConn.executeSimpleSQL(strSQL + " WHERE entry = " + window.arguments[0]);
        }
        catch (e)
        {Utils.Err(e, "edit_entry_prayer_plan.js", "OnAccept()");}
        finally
        {
           // Close connection.
            dbConn.close();
        }        
    }
    else
    {
        try
        {
            var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
            
            // Update prayer plan.
            if (document.getElementById("type").value > 0)
            {
                var strSQL = "";
                switch (parseInt(document.getElementById("type").value))
                {
                    // Daily
                    case 1:
                        strSQL = "INSERT INTO prayerplan (entry, type, nextdate, interval, number, prayerplan) VALUES(" + window.arguments[0] + ", " + document.getElementById("type").value + ", " + dailyDate + ", 'd', " + document.getElementById("days").value + ", " + document.getElementById("prayer_plans").value + ")";
                        break;
                    
                    // Weekly
                    case 2:
                        strSQL = "INSERT INTO prayerplan (entry, type, nextdate, interval, number, sunday, monday, tuesday, wednesday, thursday, friday, saturday, prayerplan) VALUES(" + window.arguments[0] + ", " + document.getElementById("type").value + ", " + weeklyDate + ", 'w', " + document.getElementById("weeks").value + ", " + Utils.ParseBool(document.getElementById("weeks_sunday").checked) + ", " + Utils.ParseBool(document.getElementById("weeks_monday").checked) + ", " + Utils.ParseBool(document.getElementById("weeks_tuesday").checked) + ", " + Utils.ParseBool(document.getElementById("weeks_wednesday").checked) + ", " + Utils.ParseBool(document.getElementById("weeks_thursday").checked) + ", " + Utils.ParseBool(document.getElementById("weeks_friday").checked) + ", " + Utils.ParseBool(document.getElementById("weeks_saturday").checked) + ", " + document.getElementById("prayer_plans").value + ")";
                        break;
                    
                    // Monthly
                    case 3:
                        strSQL = "INSERT INTO prayerplan (entry, type, nextdate, interval, number, sunday, monday, tuesday, wednesday, thursday, friday, saturday, prayerplan) VALUES(" + window.arguments[0] + ", " + document.getElementById("type").value + ", " + monthlyDate + ", '" + document.getElementById("month_add").selectedItem.value + "', " + document.getElementById("months").value;
                        switch (strDay)
                        {
                            case "Sun":
                                strSQL  += ", 1, 0, 0, 0, 0, 0, 0";
                                break;
                            
                            case "Mon":
                                strSQL  += ", 0, 1, 0, 0, 0, 0, 0";
                                break;
                            
                            case "Tues":
                                strSQL  += ", 0, 0, 1, 0, 0, 0, 0";
                                break;
                            
                            case "Wed":
                                strSQL  += ", 0, 0, 0, 1, 0, 0, 0";
                                break;
                            
                            case "Thurs":
                                strSQL  += ", 0, 0, 0, 0, 1, 0 ,0"
                                break;
                            
                            case "Fri":
                                strSQL  += ", 0, 0, 0, 0, 0, 1, 0";
                                break;
                            
                            case "Sat":
                                strSQL  += ", 0, 0, 0, 0, 0, 0, 1";
                                break;
                        }
                        strSQL += ", " + document.getElementById("prayer_plans").value + ")";
                        break;
                    
                    // Yearly
                    case 4:
                        strSQL = "INSERT INTO prayerplan (entry, type, nextdate, interval, number, prayerplan) VALUES(" + window.arguments[0] + ", " + document.getElementById("type").value + ", " + yearlyDate + ", 'y', " + document.getElementById("years").dateValue.getTime() + ", " + document.getElementById("prayer_plans").value + ")";
                        break;
                    
                    // Once
                    case 5:
                        strSQL = "INSERT INTO prayerplan (entry, type, nextdate, interval, number, prayerplan) VALUES(" + window.arguments[0] + ", " + document.getElementById("type").value + ", " + onceDate + ", '', 0, " + document.getElementById("prayer_plans").value + ")";
                        break;
                }

                dbConn.executeSimpleSQL(strSQL);
            }
        }
        catch (e)
        {Utils.Err(e, "edit_entry_prayer_plan.js", "OnAccept()");}
        finally
        {
            // Close connection.
            dbConn.close();
        }        
    }
}

// Populates the Prayer Plan List Box
function PopulatePrayerPlans()
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
    {Utils.Err(e, "edit_entry_prayer_plan.js", "PopulatePrayerPlans()");}
    finally
    {
        statement.finalize();
        dbConn.close();
    }
}