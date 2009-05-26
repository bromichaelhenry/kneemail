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
    document.getElementById("print").addEventListener("DOMContentLoaded", OnPrintLoad, true);
    document.getElementById("print").reload();
}

function OnPrintLoad()
{
    var folder;
    var type;
    var status;
    var created;
    var modified;
    var answered;
    var subject;
    var entry;
    var answer;
    var scripture;
    var prayerplan;
    
    var ctlPrint = document.getElementById("print");
    
    try
    {
        var entryHTML = "";
        
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        // Statement to retrieve the entry's data.
        var statement = dbConn.createStatement("SELECT f.name, e.type, e.status, e.created, e.modified, e.answered, e.subject, e.entry, e.answer, e.scripture, ps.name, e.id FROM entries e, folders f, prayerplan p, prayerplans ps WHERE p.nextdate <= '" + Date.now() + "' AND p.prayerplan = " + window.arguments[0] + " AND f.id = e.folder AND e.id = p.entry AND ps.id = p.prayerplan ORDER BY e.created DESC");
        
        // Enumerate through dataset
        while (statement.executeStep())
        {
            folder = statement.getUTF8String(0);
            type = statement.getInt32(1);
            status = statement.getInt32(2);
            created = statement.getInt64(3);
            modified = statement.getInt64(4);
            answered = statement.getInt64(5);
            subject = statement.getUTF8String(6); 
            entry = statement.getUTF8String(7).replace(/  /g, "&nbsp;").replace(/\r|\n|\f|\r\n/g, "<br />");
            answer = statement.getUTF8String(8).replace(/  /g, "&nbsp;").replace(/\r|\n|\f|\r\n/g, "<br />");
            scripture = statement.getUTF8String(9).replace(/  /g, "&nbsp;").replace(/\r|\n|\f|\r\n/g, "<br />");
            prayerplan = statement.getUTF8String(10);

            entryHTML += "<table width=\"100%\" border=\"0\">";
            entryHTML += "<tbody>";
            entryHTML += "<tr>";
            entryHTML += "<td colspan=\"2\">";

            if (subject != "")
                entryHTML += "<h3>" + subject + "</h3>";
    
            if (created != 0)
                entryHTML += "<b>" + Kneemail.getKneemailString("PRINT_CREATED") + "</b> " + (new Date(created)).toKneemailString() + "<br />";
    
            if (answered != 0)
                entryHTML += "<b>" + Kneemail.getKneemailString("PRINT_ANSWERED") + "</b> " + (new Date(answered)).toKneemailString() + "<br />";
    
            if (modified != 0)
                entryHTML += "<b>" + Kneemail.getKneemailString("PRINT_MODIFIED") + "</b> " + (new Date(modified)).toKneemailString() + "<br />";
    
            entryHTML += "</td>";
            entryHTML += "</tr>";
            // entryHTML += "<tr><td colspan=\"2\"><hr /></td></tr>";
            entryHTML += "<tr>";
            entryHTML += "<td align=\"left\" valign=\"top\">";
    
            if (entry != "")
                entryHTML += "<b>" + Kneemail.getKneemailString("PRINT_ENTRY") + "</b><br />" + entry;
    
            if(type == 0 && answer != "")
                entryHTML += "<br /><br /><b>" + Kneemail.getKneemailString("PRINT_ANSWER") + "</b><br />" + answer;
    
            if(scripture != "")
                entryHTML += "<br /><br /><b>" + Kneemail.getKneemailString("PRINT_SCRIPTURE") + "</b><br />" + scripture;
            
            entryHTML += "</td>";
            entryHTML += "<td align=\"right\" valign=\"top\">";

            var imgStatement = dbConn.createStatement("SELECT image FROM images WHERE entry = " + statement.getInt32(11));
            while (imgStatement.executeStep())
            {
                entryHTML += "<img src=" + imgStatement.getUTF8String(0) + " /><br />";
            }
            imgStatement.finalize();
            
            entryHTML += "</td>";
            entryHTML += "</tr>";
            entryHTML += "<tr><td colspan=\"2\"><hr /></td></tr>";
            entryHTML += "</tbody>";
            entryHTML += "</table>";
        }
        
        if (entryHTML != "")
            ctlPrint.contentDocument.getElementById("entries").innerHTML = entryHTML;

        ctlPrint.contentDocument.getElementById("prayerplan").innerHTML = "<h1>Today's Prayer Plan for " + prayerplan + "</h1>";
        
        ctlPrint.contentWindow.print();
    }
    catch (e)
    {Utils.Err(e, "print_prayer_plan.js", "OnPrintLoad()");}
    finally
    {
        // Finalize statement.
        statement.finalize();
        // Close connection.
        dbConn.close();
    }
}