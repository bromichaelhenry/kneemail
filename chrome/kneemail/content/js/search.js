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

// Searches based on the user's preferences.
function OnCmdSearch()
{
    // Clear All Children
    var treechildren = document.getElementById("entry_children");
    while(treechildren.hasChildNodes())
        treechildren.removeChild(treechildren.firstChild);
    
    if (document.getElementById("search_subject").checked || document.getElementById("search_entry").checked || document.getElementById("search_answer").checked || document.getElementById("search_scripture").checked)
    {
        switch(document.getElementById("keyword_phrase").selectedItem.id)
        {
            case "keyword":
                KeywordSearch();
                break;
    
            case "phrase":
                PhraseSearch();
                break;
        }
    }
}

// Opens the selected journal file for editing.
function OnEntryTreeDblClick()
{
    var tree = document.getElementById("entry_tree");
    window.openDialog("chrome://kneemail/content/compose.xul", "compose", "modal,centerscreen", tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
}

// Searching by key words
function KeywordSearch()
{
    // Keyword Array
    var strKeywords = document.getElementById("search_text").value.split(" ");
    
    try
    {
        var first = true;
        
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        
        var strSQL = "SELECT e.id, e.status, f.name, e.subject, e.created, e.entry, e.answer, e.scripture FROM entries e, folders f WHERE f.id = e.folder AND (";
        
        for (var i=0; i<strKeywords.length; i++)
        {
            if (document.getElementById("search_subject").checked)
                if (first)
                {
                    strSQL += "e.subject LIKE '%" + strKeywords[i] + "%'";
                    first = false;
                }
                else
                    strSQL += " OR e.subject LIKE '%" + strKeywords[i] + "%'";

            if (document.getElementById("search_entry").checked)
                if (first)
                {
                    strSQL += "e.entry LIKE '%" + strKeywords[i] + "%'";
                    first = false;
                }
                else
                    strSQL += " OR e.entry LIKE '%" + strKeywords[i] + "%'";
                    
            if (document.getElementById("search_answer").checked)
                if (first)
                {
                    strSQL += "e.answer LIKE '%" + strKeywords[i] + "%'";
                    first = false;
                }
                else
                    strSQL += " OR e.answer LIKE '%" + strKeywords[i] + "%'";
                    
            if (document.getElementById("search_scripture").checked)
                if (first)
                {
                    strSQL += "e.scripture LIKE '%" + strKeywords[i] + "%'";
                }
                else
                    strSQL += " OR e.scripture LIKE '%" + strKeywords[i] + "%'";
        }
        strSQL += ") ORDER BY e.status, e.created DESC";

        // Create SELECT statement to retrieve the entries.
        var statement = dbConn.createStatement(strSQL);
        
        // Enumerate through dataset
        while (statement.executeStep())
        {
            if(document.getElementById("match_case").checked)
            {
                for (var m=0; m<strKeywords.length; m++)
                {
                    if (document.getElementById("search_subject").checked && statement.getUTF8String(3).indexOf(strKeywords[m]) != -1)
                    {
                        AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
                        break;
                    }
                    else if (document.getElementById("search_entry").checked && statement.getUTF8String(4).indexOf(strKeywords[m]) != -1)
                    {
                        AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
                        break;
                    }
                    else if (document.getElementById("search_answer").checked && statement.getUTF8String(5).indexOf(strKeywords[m]) != -1)
                    {
                        AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
                        break;
                    }
                    else if (document.getElementById("search_scripture").checked && statement.getUTF8String(6).indexOf(strKeywords[m]) != -1)
                    {
                        AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
                        break;
                    }
                }
            }
            else
            {
                AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
            }
        }
    }
    catch (e)
    {Utils.Err(e, "search.js", "KeyWordSearch()");}
    finally
    {
        statement.finalize();
        dbConn.close();
    }
}

// Searching by whole phrase
function PhraseSearch()
{
    try
    {
        var first = true;
        
        var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
        
        var strSQL = "SELECT e.id, e.status, f.name, e.subject, e.created, e.entry, e.answer, e.scripture FROM entries e, folders f WHERE f.id = e.folder AND (";
    
        if (document.getElementById("search_subject").checked)
            if (first)
            {
                strSQL += "e.subject LIKE '%" + document.getElementById("search_text").value + "%'";
                first = false;
            }
            else
                strSQL += " OR e.subject LIKE '%" + document.getElementById("search_text").value + "%'";

        if (document.getElementById("search_entry").checked)
            if (first)
            {
                strSQL += "e.entry LIKE '%" + document.getElementById("search_text").value + "%'";
                first = false;
            }
            else
                strSQL += " OR e.entry LIKE '%" + document.getElementById("search_text").value + "%'";
                
        if (document.getElementById("search_answer").checked)
            if (first)
            {
                strSQL += "e.answer LIKE '%" + document.getElementById("search_text").value + "%'";
                first = false;
            }
            else
                strSQL += " OR e.answer LIKE '%" + document.getElementById("search_text").value + "%'";
                
        if (document.getElementById("search_scripture").checked)
            if (first)
            {
                strSQL += "e.scripture LIKE '%" + document.getElementById("search_text").value + "%'";
            }
            else
                strSQL += " OR e.scripture LIKE '%" + document.getElementById("search_text").value + "%'";

        strSQL += ") ORDER BY e.status, e.created DESC";

        // Create SELECT statement to retrieve the entries.
        var statement = dbConn.createStatement(strSQL);
        
        // Enumerate through dataset
        while (statement.executeStep())
        {
            if(document.getElementById("match_case").checked)
            {
                if (document.getElementById("search_subject").checked && statement.getUTF8String(3).indexOf(document.getElementById("search_text").value) != -1)
                {
                    AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
                }
                else if (document.getElementById("search_entry").checked && statement.getUTF8String(4).indexOf(document.getElementById("search_text").value) != -1)
                {
                    AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
                }
                else if (document.getElementById("search_answer").checked && statement.getUTF8String(5).indexOf(document.getElementById("search_text").value) != -1)
                {
                    AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
                }
                else if (document.getElementById("search_scripture").checked && statement.getUTF8String(6).indexOf(document.getElementById("search_text").value) != -1)
                {
                    AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
                }
            }
            else
            {
                AddToEntryTree(statement.getInt64(0), statement.getInt32(1), statement.getUTF8String(2), statement.getUTF8String(3), statement.getInt64(4));
            }
        }
    }
    catch (e)
    {Utils.Err(e, "search.js", "PhraseSearch()");}
    finally
    {
        statement.finalize();
        dbConn.close();
    }
}

// Adds a found journal entry to the search list.
function AddToEntryTree(entry, status, folder, subject, date)
{
    var treechildren = document.getElementById("entry_children");
    var objTreeItem = document.createElement("treeitem");
    var objTreeRow = document.createElement("treerow");
    var objTreeCellStatus = document.createElement("treecell");
    var objTreeCellFolder = document.createElement("treecell");
    var objTreeCellSubject = document.createElement("treecell");
    var objTreeCellCreated = document.createElement("treecell");
    
    switch (status)
    {
        case 0:
            objTreeCellStatus.setAttribute("src", "chrome://kneemail/skin/images/entry.png");
            break;
        
        case 1:
            objTreeCellStatus.setAttribute("src", "chrome://kneemail/skin/images/entry_answered.png");
            break;
        
        case 2:
            objTreeCellStatus.setAttribute("src", "chrome://kneemail/skin/images/entry_inactive.png");
            break;
    }
    
    objTreeCellStatus.setAttribute("value", entry);
    
    objTreeCellFolder.setAttribute("label", folder);
    
    objTreeCellSubject.setAttribute("label", subject);
    
    objTreeCellCreated.setAttribute("label", (new Date(date)).toKneemailString());
    
    objTreeRow.appendChild(objTreeCellStatus);
    objTreeRow.appendChild(objTreeCellFolder);
    objTreeRow.appendChild(objTreeCellSubject);
    objTreeRow.appendChild(objTreeCellCreated);
    objTreeRow.setAttribute("id", entry);
    
    objTreeItem.appendChild(objTreeRow);
    
    treechildren.appendChild(objTreeItem);
}