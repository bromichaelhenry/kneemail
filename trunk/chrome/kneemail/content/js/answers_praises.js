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
    try
    {
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        // Statement to retrieve the entry's data.
        var statement = dbConn.createStatement("SELECT e.*, f.name FROM entries e, folders f WHERE ((e.type = 0 AND e.status = 1) OR e.type = 1) AND e. f.id = e.folder ORDER BY e.status, e.created DESC");
        
        var i = 0;
        
        while (statement.executeStep())
        {
            i++;
            var lstEntryItem = document.createElement("richlistitem");
            lstEntryItem.setAttribute("style", "border-bottom: solid 1px black;");
            lstEntryItem.orient = "vertical";
            lstEntryItem.value = statement.getInt32(0) + ":" + statement.getInt32(1);

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
        
        document.getElementById("entries_number").value += i;
    }
    catch (e)
    {Utils.Err(e, "answers_praises.js", "OnLoad()");}
    finally
    {
        // Finalize statement.
        statement.finalize();
        // Close connection.
        dbConn.close();
    }
    
    opener.document.getElementById("progress").setAttribute("hidden", "true");
}

//OnDblClick Event for the Items
function OnEntriesDblClick(entry)
{
    var strArrayEntryFolder = entry.split(":");
    EditEntry(parseInt(strArrayEntryFolder[0]), parseInt(strArrayEntryFolder[1]), "Edit");
}

// Opens the compose screen to edit the entry.
function EditEntry(entry, folder, action)
{
    window.openDialog("chrome://kneemail/content/compose.xul", "frmCompose", "modal,centerscreen", entry, folder, action);
}