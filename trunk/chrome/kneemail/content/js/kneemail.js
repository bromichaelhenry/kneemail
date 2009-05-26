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

var blnPrayerPlan = false;
var blnTreeToggle = false;
var blnSidebarToggle = false;
var strJournalFolder = "Entries";
var strKneemailOnline = "Kneemail Online";
var strEntryColumn = "created";
var strEntrySortDirection = "DESC";
var strHelpTopic = "welcome";
var strHelpRDF = "chrome://kneemail/locale/help/help.rdf";
var intEntryCount = 0;
var strOnlineAddress = "http://dev.kneemailcentral.com/";
var intNotifications = 0;

// OnLoad Event for kneemail.
function OnLoad()
{
    SetStatusNotification("Starting " + Kneemail.getKneemailString("KNEEMAIL_TITLE") + "...");
    
    Kneemail.init();
    
    var blnNoDatabase = false;
    try
    {
        KneemailDB.open();
        KneemailDB.close();
    }
    catch (e)
    {
        blnNoDatabase = true;
        Kneemail.prompts.alert(null, Kneemail.getKneemailString("KNEEMAIL_TITLE"), Kneemail.getKneemailString("KNEEMAIL_DB_NOT_FOUND"));
    }
    
    if (blnNoDatabase)
    {
        quit(false);
    }
    else
    {
        try
        {
            ShowSplash();
            PopulatePrayerPlans();
            // LoadOnlineSearch();
            LoadFolderTree();
            
            if(Kneemail.preferences.getBoolPref("kneemail.update.startup"))
            {
                CheckForUpdateStartup();
            }
            
            document.getElementById("preview").addEventListener("DOMContentLoaded", ProcessPreview, true);
            
            /*window.addEventListener("online", OnlineOffline, false);
            window.addEventListener("offline", OnlineOffline, false);
            document.getElementById("cmd_offline").setAttribute("checked", Kneemail.io_service.offline);
        
            window.addEventListener("DOMContentLoaded", function() { onLoadBrowser.init(); }, false);
            document.getElementById("browser").addProgressListener(browserProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
            document.getElementById("browser").addEventListener("mouseover", OverLink, true);
            document.getElementById("browser").addEventListener("mouseout", OffLink, true);
            document.getElementById("browser").addEventListener("click", ClickLink, true);

            if(Kneemail.io_service.offline)
            {
                document.getElementById("browser").loadURI("chrome://kneemail/content/offline.html", null, null);
            }
            else
            {
                document.getElementById("browser").homePage = Kneemail.preferences.getCharPref("kneemail.online.home");
                document.getElementById("browser").loadURI("chrome://kneemail/content/online.html", null, null);
                window.setTimeout("document.getElementById('browser').goHome();", 3000);
            }*/

            /*window.addEventListener("DOMContentLoaded", function() { onLoadSearchBrowser.init(); }, false);
            document.getElementById("search_browser").addProgressListener(searchBrowserProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
            document.getElementById("search_browser").addEventListener("mouseover", OverLink, true);
            document.getElementById("search_browser").addEventListener("mouseout", OffLink, true);
            document.getElementById("search_browser").addEventListener("click", ClickLink, true);

            if(Kneemail.io_service.offline)
            {
                document.getElementById("search_browser").loadURI("chrome://kneemail/content/offline.html", null, null);
            }*/
        }
        catch (e)
        {alert(e); quit(true);}
    }
    
    strEntryColumn = Kneemail.preferences.getCharPref("kneemail.entries.sort.column");
    strEntrySortDirection = Kneemail.preferences.getCharPref("kneemail.entries.sort.direction");
    
    switch(strEntryColumn)
    {
        case "subject":
            if (strEntrySortDirection == "DESC")
                document.getElementById("sort_subject").src = "chrome://kneemail/skin/images/sort_desc.png";
            else
                document.getElementById("sort_subject").src = "chrome://kneemail/skin/images/sort_asc.png";
            break;
        
        case "created":
            if (strEntrySortDirection == "DESC")
                document.getElementById("sort_created").src = "chrome://kneemail/skin/images/sort_desc.png";
            else
                document.getElementById("sort_created").src = "chrome://kneemail/skin/images/sort_asc.png";
            break;
        
        case "modified":
            if (strEntrySortDirection == "DESC")
                document.getElementById("sort_modified").src = "chrome://kneemail/skin/images/sort_desc.png";
            else
                document.getElementById("sort_modified").src = "chrome://kneemail/skin/images/sort_asc.png";
            break;
    }
    
    ClearStatusNotification();
    NumberofEntries();
    
    /*if (Kneemail.preferences.getBoolPref("kneemail.online.autologin"))
    {
        OnCmdKneemailOnline();
    }*/
}

// OnUnload Event for kneemail. Used for cleanup.
function OnUnload()
{
    PersistFolders();
    
    if (Kneemail.preferences.getBoolPref("kneemail.backup.shutdown"))
    {
        try
        {
            SetStatusNotification("Backing up database...");
            
            var zipWriter = Components.classes["@mozilla.org/zipwriter;1"].createInstance(Components.interfaces.nsIZipWriter);
            
            zipWriter.open(FileUtils.getFile(Kneemail.preferences.getCharPref("kneemail.path.backup") + Kneemail.preferences.getCharPref("kneemail.path.backup.filename")), 0x04 | 0x08 | 0x20);
            zipWriter.comment = "This is a Kneemail database backup file.";
            zipWriter.addEntryFile(Kneemail.database_filename, Components.interfaces.nsIZipWriter.COMPRESSION_BEST, FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename), false);
            zipWriter.close();
            
            ClearStatusNotification();
        }
        catch (e)
        {
            Kneemail.prompts.alert(null, Kneemail.getKneemailString("KNEEMAIL_TITLE"), Kneemail.getKneemailString("KNEEMAIL_DB_NOT_BACKED_UP"));
        }
    }
    
    // KneemailOnline.logout();
}

// OnCommand Event for quiting the application.
function OnCmdQuit()
{
    quit(false);
}

// OnCommand Event for connecting/disconnecting Kneemail Online
function OnCmdKneemailOnline()
{
    if (KneemailOnline.isConnected)
    {
        KneemailOnline.logout();
        if (!KneemailOnline.isConnected)
        {
            document.getElementById("kneemail_online_status").image = "chrome://kneemail/skin/images/kneemail_online_disconnected.png";
        }
    }
    else
    {
        KneemailOnline.login();
        if (KneemailOnline.isConnected)
        {
            document.getElementById("kneemail_online_status").image = "chrome://kneemail/skin/images/kneemail_online_connected.png";
        }
    }
}

// OnCommand Event for showing and hiding the left sidebar.
function OnCmdToggleSidebar()
{
    var toggle_menu = document.getElementById("view_menu_toggle_sidebar");
    var toggle_toolbarbutton = document.getElementById("sidebar_toolbar_toggle_sidebar");
    
    if (blnSidebarToggle)
    {
        toggle_menu.setAttribute("class", "menuitem-iconic cmd_toggle_sidebar_close");
        toggle_menu.label = Kneemail.getKneemailString("MAIN_MENU_TOGGLE_SIDEBAR_CLOSE");
        toggle_toolbarbutton.setAttribute("class", "cmd_toggle_sidebar_close");
        document.getElementById("left").hidden = false;
        document.getElementById("sidebar_splitter").hidden = false;
        blnSidebarToggle = false;
    }
    else
    {
        toggle_menu.setAttribute("class", "menuitem-iconic cmd_toggle_sidebar_open");
        toggle_menu.label = Kneemail.getKneemailString("MAIN_MENU_TOGGLE_SIDEBAR_OPEN");
        toggle_toolbarbutton.setAttribute("class", "cmd_toggle_sidebar_open");
        document.getElementById("left").hidden = true;
        document.getElementById("sidebar_splitter").hidden = true;
        blnSidebarToggle = true;
    }
}

// Resets the topic and RDF file for help.
function ResetHelp()
{
    window.setTimeout("strHelpTopic = 'welcome'; strHelpRDF = 'chrome://kneemail/locale/help/help.rdf';", 1)
}

// Sets help topic to open/close sidebar
function OpenCloseSidebarTooltipShown()
{
    strHelpTopic = "open_close_sidebar";
}

// Sets help topic to new folder
function NewFolderTooltipShown()
{
    strHelpTopic = "new_folder";
}

// Sets help topic to delete folder
function DeleteFolderTooltipShown()
{
    strHelpTopic = "delete_folder";
}

// Sets help topic to edit folder
function EditFolderTooltipShown()
{
    strHelpTopic = "edit_folder";
}

// Sets help topic to new entry
function NewEntryTooltipShown()
{
    strHelpTopic = "new_entry";
}

// Sets help topic to delete entry
function DeleteEntryTooltipShown()
{
    strHelpTopic = "delete_entry";
}

// Sets help topic to answered entry
function AnsweredEntryTooltipShown()
{
    strHelpTopic = "answered_entry";
}

// Sets help topic to entry Prayer Plan settings
function PrayerPlanEntryTooltipShown()
{
    strHelpTopic = "edit_prayerplan_entry";
}

// Sets help topic to Prayer Plans
function PrayerPlansTooltipShown()
{
    strHelpTopic = "prayer_plans";
}

// Sets help topic to Search
function SearchTooltipShown()
{
    strHelpTopic = "search";
}

// Resets all the Kneemail sidebar buttons.
function ResetKneemailButtons()
{
    var buttons = document.getElementById("kneemail_buttons");
    var menubars = document.getElementById("menubars");
    var toolbars = document.getElementById("toolbars");
    
    for (var i=0; i< buttons.childNodes.length; i++)
    {
        
        buttons.childNodes[i].setAttribute("class", "side_panel_button");
        menubars.childNodes[i + 2].hidden = true;
        toolbars.childNodes[i + 2].hidden = true;
    }
}

// Shows the user their journal.
function OnCmdShowJournal()
{
    ResetKneemailButtons();
    
    var button = document.getElementById("kneemail_journal_button");

    button.setAttribute("class", "side_panel_button_selected");
    document.getElementById("left_sidebar_header").image = button.image;
    document.getElementById("left_sidebar_header").label = button.label;
    document.getElementById("right_header").value = strJournalFolder;
    document.getElementById("left_deck").selectedIndex = 0;
    document.getElementById("right_deck").selectedIndex = 0;
    document.getElementById("toolbars").childNodes[2].hidden = false;
    document.getElementById("menubars").childNodes[2].hidden = false;
}

// Shows the user their journal.
function OnCmdShowOnline()
{
    ResetKneemailButtons();
    
    var button = document.getElementById("kneemail_online_button");
    
    strKneemailOnline = document.getElementById("browser").contentTitle;

    button.setAttribute("class", "side_panel_button_selected");
    document.getElementById("left_sidebar_header").image = button.image;
    document.getElementById("left_sidebar_header").label = button.label;
    document.getElementById("right_header").value = strKneemailOnline;
    document.getElementById("left_deck").selectedIndex = 1;
    document.getElementById("right_deck").selectedIndex = 1;
    document.getElementById("toolbars").childNodes[3].hidden = false;
    document.getElementById("menubars").childNodes[3].hidden = false;
}

// Shows which part of Kneemail Desktop the user wants to see.
function OnClickKneemailButton(button)
{
    var buttonimages = document.getElementById("kneemail_button_images");
    var buttons = document.getElementById("kneemail_buttons");
    var toolbars = document.getElementById("toolbars");
    
    for (var i=0; i< buttons.childNodes.length; i++)
    {
        
        buttonimages.childNodes[i].style.backgroundImage = "url('chrome://kneemail/skin/images/header.png')";
        buttons.childNodes[i].style.backgroundImage = "url('chrome://kneemail/skin/images/header.png')";
        toolbars.childNodes[i + 2].hidden = true;
        
        if (button == buttons.childNodes[i])
        {
            buttonimages.childNodes[i].style.backgroundImage = "url('chrome://kneemail/skin/images/header_selected.png')";
            document.getElementById("left_header_image").src = buttonimages.childNodes[i].src;
            document.getElementById("left_header_image").src = buttonimages.childNodes[i].src;
            document.getElementById("right_header").value = button.getAttribute("header");
            document.getElementById("left_deck").selectedIndex = i;
            document.getElementById("right_deck").selectedIndex = i;
            document.getElementById("toolbars").childNodes[i + 2].hidden = false;
        }
    }

    document.getElementById("left_header").value = button.value;
    button.style.backgroundImage = "url('chrome://kneemail/skin/images/header_selected.png')";
}

// Shows the journal of Kneemail Desktop.
function OnClickJournalButton()
{
    var icon = document.getElementById("kneemail_journal_icon");
    var button = document.getElementById("kneemail_journal_button");
    
    var buttonimages = document.getElementById("kneemail_button_images");
    var buttons = document.getElementById("kneemail_buttons");
    var toolbars = document.getElementById("toolbars");
    
    for (var i=0; i< buttons.childNodes.length; i++)
    {
        
        buttonimages.childNodes[i].style.backgroundImage = "url('chrome://kneemail/skin/images/header.png')";
        buttons.childNodes[i].style.backgroundImage = "url('chrome://kneemail/skin/images/header.png')";
        toolbars.childNodes[i + 2].hidden = true;
        
        if (button == buttons.childNodes[i])
        {
            buttonimages.childNodes[i].style.backgroundImage = "url('chrome://kneemail/skin/images/header_selected.png')";
            document.getElementById("left_header_image").src = buttonimages.childNodes[i].src;
            document.getElementById("left_header_image").src = buttonimages.childNodes[i].src;
            document.getElementById("right_header").value = button.getAttribute("header");
            document.getElementById("left_deck").selectedIndex = i;
            document.getElementById("right_deck").selectedIndex = i;
            document.getElementById("toolbars").childNodes[i + 2].hidden = false;
        }
    }

    document.getElementById("left_header").value = button.value;
    button.style.backgroundImage = "url('chrome://kneemail/skin/images/header_selected.png')";
}

// OnSelect Event of the folder tree.
function OnFolderTreeSelect()
{
    var tree = document.getElementById("folder_tree");
    var folderId = tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0));
    var folderName = tree.view.getCellText(tree.view.selection.currentIndex, tree.columns.getColumnAt(0));
    
    if (folderId == 1)
    {
        tree.contextMenu = "inactive_context_menu";
    }
    else if (folderId == 2)
    {
        tree.contextMenu = "deleted_context_menu";
    }
    else
    {
        tree.contextMenu = "folder_tree_context_menu";
    }
    
    document.getElementById("right_header").value = folderName;
    strJournalFolder = folderName;
    
    LoadEntries(folderId);

    // Entry commands.
    document.getElementById("cmd_new_entry").removeAttribute("disabled");

    // Folder commands.
    document.getElementById("cmd_delete_folder").removeAttribute("disabled");
    document.getElementById("cmd_edit_folder").removeAttribute("disabled");
    document.getElementById("cmd_print_folder").removeAttribute("disabled");
    
    document.getElementById("entry_tree").view.selection.select(0);
    ShowEntry();
}

// OnDblClick Event for the folder tree.
function OnFolderTreeDblClick()
{
    // Forward event to rename folder.
    OnCmdRenameFolder();
}

// OnCommand Event for emptying the inactive folder
function OnCmdEmptyInactiveFolder()
{
    if(Kneemail.prompts.confirm(window, Kneemail.getKneemailString("FOLDER_DELETE_FOLDER_TITLE"), Kneemail.getKneemailString("FOLDER_EMPTY_INACTIVE_FOLDER_PROMPT")))
    {
        EmptyInactive();
        LoadFolderTree();
        LoadEntries(0);
    }
}

// OnCommand Event for emptying the inactive folder
function OnCmdEmptyDeletedFolder()
{
    if(Kneemail.prompts.confirm(window, Kneemail.getKneemailString("FOLDER_DELETE_FOLDER_TITLE"), Kneemail.getKneemailString("FOLDER_EMPTY_DELETED_FOLDER_PROMPT")))
    {
        EmptyDeleted();
        LoadFolderTree();
        LoadEntries(0);
    }
}

// OnCommand Event for creating a new folder.
function OnCmdNewFolder()
{
    var tree = document.getElementById("folder_tree");

    try
    {
        if (tree.view.getCellValue(tree.currentIndex, tree.columns[0]) > 2)
        {
            try
            {
                window.openDialog("chrome://kneemail/content/new_folder.xul", "new_folder", "modal,centerscreen", tree.view.getCellValue(tree.currentIndex, tree.columns[0]), tree.view.getCellText(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
            }
            catch (e)
            {
                // Utils.Err(e, "kneemail.js", "OnCmdNewFolder()");
                window.openDialog("chrome://kneemail/content/new_folder.xul", "new_folder", "modal,centerscreen", "0", "");
            }
        }
        else
        {
            window.openDialog("chrome://kneemail/content/new_folder.xul", "new_folder", "modal,centerscreen", "0", "");
        }
    }
    catch (e)
    {
        // Utils.Err(e, "kneemail.js", "OnCmdNewFolder()");
        window.openDialog("chrome://kneemail/content/new_folder.xul", "new_folder", "modal,centerscreen", "0", "");
    }

    LoadFolderTree();
    // LoadEntries(0);
}

// OnCommand Event for deleting a folder.
function OnCmdDeleteFolder()
{
    try
    {
        var tree = document.getElementById("folder_tree");
        var id = tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0));
        
        KneemailDB.open();
        var folder = KneemailDB.getFolder(id);
        
        if(Kneemail.prompts.confirm(window, Kneemail.getKneemailString("FOLDER_DELETE_FOLDER_TITLE"), Kneemail.getKneemailString("FOLDER_DELETE_FOLDER_PROMPT") + " [" + folder.name + "]?"))
        {
            folder.Delete();
            
            LoadFolderTree();
            LoadEntries(0);
            document.getElementById("cmd_delete_folder").setAttribute("disabled", "true");
            document.getElementById("cmd_edit_folder").setAttribute("disabled", "true");
        }
    }
    catch (e)
    {
        Utils.Err(e, "kneemail.js", "OnCmdDeleteFolder()");
    }
    finally
    {
        if (KneemailDB.isOpen)
            KneemailDB.close();
    }
}

// OnCommand Event for editing a folder.
function OnCmdEditFolder()
{
    var tree = document.getElementById("folder_tree");
    window.openDialog("chrome://kneemail/content/edit_folder.xul", "edit_folder", "modal,centerscreen", tree.view.getCellValue(tree.currentIndex, tree.columns[0]));
    
    LoadFolderTree();
    // LoadEntries(0);
}

// OnCommand Event to print folder.
function OnCmdPrintFolder()
{
    var folderTree = document.getElementById("folder_tree");
    window.openDialog("chrome://kneemail/content/print_folder.xul", "print_folder", "modal,centerscreen", folderTree.view.getCellValue(folderTree.view.selection.currentIndex, folderTree.columns.getColumnAt(0)));
}

// OnCommand Event for a new entry.
function OnCmdNewEntry()
{
    var tree = document.getElementById("folder_tree");
    window.openDialog("chrome://kneemail/content/compose.xul", "compose", "modal,centerscreen", 0, tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)), "New");

    LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
    document.getElementById("entry_tree").view.selection.select(0);
    ShowEntry();
}

// OnSelect Event for the entry tree.
function OnEntryTreeSelect()
{
    ShowEntry();
}

// OnDblClick Event for a selected entry.
function OnEntryTreeDblClick()
{
    var entryTree = document.getElementById("entry_tree");
    var folderTree = document.getElementById("folder_tree");
    EditEntry(entryTree.view.getCellValue(entryTree.view.selection.currentIndex, entryTree.columns.getColumnAt(0)), folderTree.view.getCellValue(folderTree.view.selection.currentIndex, folderTree.columns.getColumnAt(0)), "Edit")
}

// OnCommand Event to delete entry.
function OnCmdDeleteEntry()
{
    var tree = document.getElementById("entry_tree");
    var selected = tree.view.selection.currentIndex;

    if(Kneemail.prompts.confirm(window, Kneemail.getKneemailString("ENTRY_DELETE_ENTRY_TITLE"), Kneemail.getKneemailString("ENTRY_DELETE_ENTRY_PROMPT")))
    {
        try
        {
            KneemailDB.open();

            var rangeCount = tree.view.selection.getRangeCount();
            for(var i=0; i<rangeCount; i++)
            {
                var start = {};
                var end = {};
                tree.view.selection.getRangeAt(i,start,end);
                for(var c=start.value; c<=end.value; c++)
                {
                    // Delete the selected entry from the prayerplan table.
                    KneemailDB.execute("DELETE FROM prayerplan WHERE entry = " + tree.view.getItemAtIndex(c).firstChild.id);
                    
                    // Move to Deleted Folder
                    KneemailDB.execute("UPDATE entries SET folder = 2 WHERE id = " + tree.view.getItemAtIndex(c).firstChild.id);
                }
            }
        }
        catch (e)
        {Untils.Err (e, "kneemail.js", "OnCmdDeleteEntry()");}
        finally
        {
            KneemailDB.close();
        }
    
        tree = document.getElementById("folder_tree");
        LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
        
        tree = document.getElementById("entry_tree");
        if (selected > (tree.view.rowCount - 1))
            tree.view.selection.select(tree.view.rowCount - 1);
        else
            tree.view.selection.select(selected);
            
        ShowEntry();
    }
}

// OnCommand Event to edit entry.
function OnCmdEditEntry()
{
    var entryTree = document.getElementById("entry_tree");
    var folderTree = document.getElementById("folder_tree");
    EditEntry(entryTree.view.getCellValue(entryTree.view.selection.currentIndex, entryTree.columns.getColumnAt(0)), folderTree.view.getCellValue(folderTree.view.selection.currentIndex, folderTree.columns.getColumnAt(0)), "Edit")
    ShowEntry();
}

// OnCommand Event to mark entry answered.
function OnCmdAnsweredEntry()
{
    var entryTree = document.getElementById("entry_tree");
    var folderTree = document.getElementById("folder_tree");
    EditEntry(entryTree.view.getCellValue(entryTree.view.selection.currentIndex, entryTree.columns.getColumnAt(0)), folderTree.view.getCellValue(folderTree.view.selection.currentIndex, folderTree.columns.getColumnAt(0)), "Answered")
    ShowEntry();
}

// OnCommand Event to edit the selected entry's prayer plan settings.
function OnCmdEditEntryPrayerPlan()
{
    var tree = document.getElementById("entry_tree");
    window.openDialog("chrome://kneemail/content/edit_entry_prayer_plan.xul", "edit_entry_prayer_plan", "modal,centerscreen", tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
}

// OnCommand Event to print entry.
function OnCmdPrintEntry()
{
    var entryTree = document.getElementById("entry_tree");
    window.openDialog("chrome://kneemail/content/print_entry.xul", "print_entry", "modal,centerscreen", entryTree.view.getCellValue(entryTree.view.selection.currentIndex, entryTree.columns.getColumnAt(0)));
}

// OnDragGesture Event for the entry tree.
function OnEntryTreeDragGesture()
{
    nsDragAndDrop.startDrag(event, entryObserver);
}

// On Command Event for full screen
function OnCmdViewFullScreen()
{
    var fullscreen = document.getElementById("main_menu_full_screen");
    
    if (fullscreen.getAttribute("class") == "cmd_view_fullscreen_normal")
    {
        fullscreen.setAttribute("class", "cmd_view_fullscreen");
        fullscreen.label = Kneemail.getKneemailString("MAIN_MENU_FULL_SCREEN_NORMAL");
        window.fullScreen = true;
    }
    else
    {
        fullscreen.setAttribute("class", "cmd_view_fullscreen_normal");
        fullscreen.label = Kneemail.getKneemailString("MAIN_MENU_FULL_SCREEN");
        window.fullScreen = false;
    }
    
    document.getElementById("main_menu_panel").hidePopup();
}

// OnCommand Event for Edit Prayer Plans.
function OnCmdEditPrayerPlans()
{
    window.openDialog("chrome://kneemail/content/edit_prayer_plans.xul", "edit_prayer_plans", "modal,centerscreen");
    PopulatePrayerPlans();
}

// OnCommand Event for the answered prayer and praises screen.
function OnCmdAnswersPraises()
{
    window.openDialog("chrome://kneemail/content/answers_praises.xul", "answers_praises", "modal,centerscreen");
    ShowEntry();
}

// OnCommand Event for search.
function OnCmdSearch()
{
    window.openDialog("chrome://kneemail/content/search.xul", "search", "modal,centerscreen");
}

// OnCommand Event for checking for an update.
function OnCmdCheckForUpdate()
{
    CheckForUpdate();
}

// OnCommand Event for the add-ons screen
function OnCmdAddOns()
{
    window.openDialog("chrome://mozapps/content/extensions/extensions.xul", "extensions", "toolbar,modal");
}

// OnCommand Event for compacting the kneemail.sqlite database.
function OnCmdCompact()
{
    SetStatusNotification("Compacting Database...");
    try
    {
        EmptyDeleted();

        KneemailDB.open();
        KneemailDB.compact();
    }
    catch (e)
    {Untils.Err(e, "kneemail.js", "OnCmdCompact()");}
    finally
    {
        KneemailDB.close();
    }
    SetStatusNotificationTimed("Compacting Complete...", 5000);
}

// OnCommand Event for backing up the kneemail.sqlite database.
function OnCmdBackup()
{
    Backup();
}

// OnCommand Event for restoring a backup kneemail.sqlite database.
function OnCmdRestore()
{
    var check = {value: false};
    var flags = Kneemail.prompts.BUTTON_POS_0 * Kneemail.prompts.BUTTON_TITLE_IS_STRING + Kneemail.prompts.BUTTON_POS_1 * Kneemail.prompts.BUTTON_TITLE_IS_STRING;
    var button = Kneemail.prompts.confirmEx(window, Kneemail.getKneemailString("CONFIRM_RESTORE_TITLE"), Kneemail.getKneemailString("CONFIRM_RESTORE"), flags, Kneemail.getKneemailString("CONFIRM_YES"), Kneemail.getKneemailString("CONFIRM_NO"), null, null, check);
    if(button == 0)
    {    
        Restore();
        ShowSplash();
        LoadFolderTree();
        
        // Clear All Children in the Entry Control
        var treechildren = document.getElementById("entry_children");
        while(treechildren.hasChildNodes())
            treechildren.removeChild(treechildren.firstChild);
    }
}

// OnCommand Event for preferences.
function OnCmdPreferences()
{
    window.openDialog("chrome://kneemail/content/preferences.xul", "preferences", "modal,centerscreen,toolbar");

    LoadFolderTree();
    LoadEntries(0);
}

// OnCommand Event for Prayer Plan
function OnCmdPrayerPlan()
{
    LaunchPrayerPlan(0);
}

// OnCommand Event for the help system.
function OnCmdHelp()
{
    openHelp(strHelpTopic, strHelpRDF);
}

// OnCommand Event for contacting us
function OnCmdContact()
{
    OnCmdShowOnline();
    document.getElementById("browser").loadURI("http://online.kneemailcentral.com/pg/contact");
}

// OnCommand Event for the "About" screen.
function OnCmdAbout()
{
    window.openDialog("chrome://kneemail/content/about.xul", "frmAbout", "modal,centerscreen");
}

// Opens the update dialog when the update toolbar button is clicked.
function OnCmdUpdate()
{
    CheckForUpdate();
}

// Loads folder tree
function LoadFolderTree()
{
    // Entry commands.
    document.getElementById("cmd_new_entry").setAttribute("disabled", "true");
    document.getElementById("cmd_delete_entry").setAttribute("disabled", "true");
    document.getElementById("cmd_edit_entry").setAttribute("disabled", "true");
    document.getElementById("cmd_answered_entry").setAttribute("disabled", "true");
    document.getElementById("cmd_print_entry").setAttribute("disabled", "true");

    // Folder commands.
    document.getElementById("cmd_delete_folder").setAttribute("disabled", "true");
    document.getElementById("cmd_edit_folder").setAttribute("disabled", "true");
    document.getElementById("cmd_print_folder").setAttribute("disabled", "true");

    PersistFolders();

    // Clear All Folders
    var treechildren = document.getElementById("folder_children");
    while(treechildren.hasChildNodes())
        treechildren.removeChild(treechildren.firstChild);
    
    try
    {
        KneemailDB.open();
        
        var folderTree = KneemailDB.getFolderTree(strEntryColumn, strEntrySortDirection);
        if (!folderTree.error)
        {
            for (var i=0; i<folderTree.branches.length; i++)
            {
                var objTreeItem = document.createElement("treeitem");
                var objTreeRow = document.createElement("treerow");
                var objTreeCell = document.createElement("treecell");
                
                objTreeCell.setAttribute("label", folderTree.branches[i].name);
                objTreeCell.setAttribute("value", folderTree.branches[i].id);
                
                if (folderTree.branches[i].id == 1)
                    objTreeCell.setAttribute("src", "chrome://kneemail/skin/images/folder_inactive.png");
                else if (folderTree.branches[i].id == 2)
                    objTreeCell.setAttribute("src", "chrome://kneemail/skin/images/folder_delete.png");
                else
                    objTreeCell.setAttribute("src", "chrome://kneemail/skin/images/folder.png");
                
                objTreeRow.appendChild(objTreeCell);
                // objTreeRow.setAttribute("id", folderTree.branches[i].id);
                objTreeItem.setAttribute("id", folderTree.branches[i].id);
                if (folderTree.branches[i].open == 1)
                    objTreeItem.setAttribute("open", true);
                objTreeItem.appendChild(objTreeRow);
                
                var branch = LoadBranches(folderTree.branches[i])
                if (branch.childNodes.length > 0)
                {
                    objTreeItem.appendChild(branch);
                    objTreeItem.setAttribute("container", "true");
                }
            
                treechildren.appendChild(objTreeItem);
            }
        }
        else
            Kneemail.prompts.alert(this, Kneemail.getKneemailString("KNEEMAIL_TITLE"), Kneemail.getKneemailString("KNEEMAIL_DB_FOLDER_TREE_ERROR"));
    }
    catch (e)
    {
        Utils.Err(e, "kneemail.js", "LoadFolderTree()");
    }
    finally
    {
        KneemailDB.close();
    }
}

// Loads a branch
function LoadBranches(folderTree)
{
    var objTreeChildren = document.createElement("treechildren");

    try
    {
        var trunk = [];
        for (var i=0; i<folderTree.branches.length; i++)
        {
            var objTreeItem = document.createElement("treeitem");
            var objTreeRow = document.createElement("treerow");
            var objTreeCell = document.createElement("treecell");
            
            objTreeCell.setAttribute("label", folderTree.branches[i].name);
            objTreeCell.setAttribute("value", folderTree.branches[i].id);
            objTreeCell.setAttribute("src", "chrome://kneemail/skin/images/folder.png");
            
            objTreeRow.appendChild(objTreeCell);
            // objTreeRow.setAttribute("id", folderTree.branches[i].id);
            if (folderTree.branches[i].open == 1)
                objTreeItem.setAttribute("open", true);
            objTreeItem.setAttribute("id", folderTree.branches[i].id);
            objTreeItem.appendChild(objTreeRow);
            
            var branch = LoadBranches(folderTree.branches[i])
            if (branch.childNodes.length > 0)
            {
                objTreeItem.appendChild(branch);
                objTreeItem.setAttribute("container", "true");
            }
            
            objTreeChildren.appendChild(objTreeItem);
        }
    }
    catch (e)
    {Utils.Err (e, "kneemail.js", "LoadBranches()");}
    
    return objTreeChildren;
}

// Persists folders in the folder tree (open or closed)
function PersistFolders()
{
    var treeitems = document.getElementsByTagName("treeitem");
    
    for (var i=0; i<treeitems.length; i++)
    {
        try
        {
            KneemailDB.open()
            
            if (treeitems[i].getAttribute("open") == "true")
            {
                KneemailDB.execute("UPDATE folders SET open = 1 WHERE id = " + treeitems[i].id);
            }
            else
            {
                KneemailDB.execute("UPDATE folders SET open = 0 WHERE id = " + treeitems[i].id);
            }
            
            document.removeChild(treeitems[i]);
        }
        catch(e)
        {}
        finally
        {
            KneemailDB.close();
        }   
    }
}

// Deletes a folder and its entries.
function DeleteFolder(id)
{
    if (id > 2)
    {
        try
        {
            KneemailDB.open();
            
            // Delete the entries from the prayer plan.
            KneemailDB.execute("DELETE FROM prayerplan WHERE entry IN (SELECT id FROM entries WHERE folder = " + id + ")");
            
            // Create SELECT statement to retrieve subfolders.
            var statement = KneemailDB.statement("SELECT id FROM folders WHERE parent = " + id);
            
            // Enumerate through dataset
            while (statement.executeStep())
            {
                DeleteSubFolder(statement.getInt64(0));
            }
            
            // Move to Deleted Folder
            KneemailDB.execute("UPDATE folders SET parent = 2 WHERE id = " + id);
        }
        catch (e)
        {Untils.Err (e, "kneemail.js", "DeleteFolder()");}
        finally
        {
            statement.finalize();
            KneemailDB.close();
        }
    
        LoadEntries(0);
    }
    else if (id == 1)
    {
        EmptyInactive();
    }
    else if (id == 2)
    {
        EmptyDeleted();
    }
}

// Deletes a subfolder and its entries.
function DeleteSubFolder(id)
{
    try
    {
        // Create SELECT statement to retrieve subfolders.
        var statement = KneemailDB.statement("SELECT id FROM folders WHERE parent = " + id);
        
        // Enumerate through dataset
        while (statement.executeStep())
        {
            DeleteSubFolder(statement.getInt64(0));
        }
    }
    catch (e)
    {Untils.Err (e, "kneemail.js", "DeleteSubFolder()");}
    finally
    {
        statement.finalize();
    }
}

// Deletes all folders and entries from the Deleted folder.
function EmptyDeleted()
{
    try
    {
        KneemailDB.open();
        
        // Delete the entries from the prayer plan.
        KneemailDB.execute("DELETE FROM prayerplan WHERE entry IN (SELECT id FROM entries WHERE folder = 2)");
        
        // Delete the entries from the images table.
        KneemailDB.execute("DELETE FROM images WHERE entry IN (SELECT id FROM entries WHERE folder = 2)");
        
        // Delete the entries.
        KneemailDB.execute("DELETE FROM entries WHERE folder = 2");
        
        // Create SELECT statement to retrieve subfolders.
        var statement = KneemailDB.statement("SELECT id FROM folders WHERE parent = 2");
        
        // Enumerate through dataset
        while (statement.executeStep())
        {
            EmptyDeletedSubFolder(statement.getInt64(0));
        }
    }
    catch (e)
    {Untils.Err (e, "kneemail.js", "EmptyDeleted()");}
    finally
    {
        statement.finalize();
        KneemailDB.close();
    }

    LoadEntries(2);
}

// Deletes a subfolder and its entries.
function EmptyDeletedSubFolder(id)
{
    try
    {
        // Delete the entries.
        KneemailDB.execute("DELETE FROM entries WHERE folder = " + id);
        
        // Delete the entries from the prayer plan.
        KneemailDB.execute("DELETE FROM prayerplan WHERE entry IN (SELECT id FROM entries WHERE folder = " + id + ")");
        
        // Create SELECT statement to retrieve subfolders.
        var statement = KneemailDB.statement("SELECT id FROM folders WHERE parent = " + id);
        
        // Enumerate through dataset
        while (statement.executeStep())
        {
            EmptyDeletedSubFolder(statement.getInt64(0));
        }
        
        // Delete the folder.
        KneemailDB.execute("DELETE FROM folders WHERE id = " + id);
    }
    catch (e)
    {Untils.Err (e, "kneemail.js", "EmptyDeletedSubFolder()");}
    finally
    {
        statement.finalize();
    }
}

// Moves all Inactive entries to the Deleted folder.
function EmptyInactive()
{
    try
    {
        KneemailDB.open();
        
        // Delete the entries.
        KneemailDB.execute("UPDATE entries SET folder = 2 WHERE folder = 1");
    }
    catch (e)
    {Untils.Err (e, "kneemail.js", "EmptyInactive()");}
    finally
    {
        KneemailDB.close();
    }

    LoadEntries(1);
}

// Renames the selected folder.
function RenameFolder(new_name, id)
{
    try
    {
        KneemailDB.open();
        
        // Delete the entries.
        KneemailDB.execute("UPDATE folders SET name = '" + new_name + "' WHERE id = " + id);        
    }
    catch (e)
    {Untils.Err (e, "kneemail.js", "RenameFolder()");}
    finally
    {
        KneemailDB.close();
    }
}

// OnClick event for the sort order for the subject column of the entry tree
function OnClickEntrySortSubject()
{
    var tree = document.getElementById("folder_tree");
    var entrytree = document.getElementById("entry_tree");
    var selected = entrytree.view.getCellValue(entrytree.view.selection.currentIndex, entrytree.columns.getColumnAt(0));
    
    if (strEntryColumn == "subject")
    {
        if (strEntrySortDirection == "DESC")
        {
            strEntrySortDirection = "ASC";
            document.getElementById("sort_subject").src = "chrome://kneemail/skin/images/sort_asc.png"
        }
        else
        {
            strEntrySortDirection = "DESC";
            document.getElementById("sort_subject").src = "chrome://kneemail/skin/images/sort_desc.png"
        }
        
        LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
    }
    else
    {
        document.getElementById("sort_created").src = "";
        document.getElementById("sort_modified").src = "";
        
        strEntryColumn = "subject";
        strEntrySortDirection = "DESC";
        
        document.getElementById("sort_subject").src = "chrome://kneemail/skin/images/sort_desc.png"

        LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
    }
    
    Kneemail.preferences.setCharPref("kneemail.entries.sort.column", strEntryColumn);
    Kneemail.preferences.setCharPref("kneemail.entries.sort.direction", strEntrySortDirection);

    for (var i=0; i<entrytree.view.rowCount; i++)
    {
        if (selected == entrytree.view.getCellValue(i, entrytree.columns.getColumnAt(0)))
        {
            entrytree.view.selection.select(i);
            break;
        }
    }
}

// OnClick event for the sort order for the created column of the entry tree
function OnClickEntrySortCreated()
{
    var tree = document.getElementById("folder_tree");
    var entrytree = document.getElementById("entry_tree");
    var selected = entrytree.view.getCellValue(entrytree.view.selection.currentIndex, entrytree.columns.getColumnAt(0));

    if (strEntryColumn == "created")
    {
        if (strEntrySortDirection == "DESC")
        {
            strEntrySortDirection = "ASC";
            document.getElementById("sort_created").src = "chrome://kneemail/skin/images/sort_asc.png"
        }
        else
        {
            strEntrySortDirection = "DESC";
            document.getElementById("sort_created").src = "chrome://kneemail/skin/images/sort_desc.png"
        }
        
        LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
    }
    else
    {
        document.getElementById("sort_subject").src = "";
        document.getElementById("sort_modified").src = "";
        
        strEntryColumn = "created";
        strEntrySortDirection = "DESC";
        
        document.getElementById("sort_created").src = "chrome://kneemail/skin/images/sort_desc.png"

        LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
    }
    
    Kneemail.preferences.setCharPref("kneemail.entries.sort.column", strEntryColumn);
    Kneemail.preferences.setCharPref("kneemail.entries.sort.direction", strEntrySortDirection);

    for (var i=0; i<entrytree.view.rowCount; i++)
    {
        if (selected == entrytree.view.getCellValue(i, entrytree.columns.getColumnAt(0)))
        {
            entrytree.view.selection.select(i);
            break;
        }
    }
}

// OnClick event for the sort order for the modified column of the entry tree
function OnClickEntrySortModified()
{
    var tree = document.getElementById("folder_tree");
    var entrytree = document.getElementById("entry_tree");
    var selected = entrytree.view.getCellValue(entrytree.view.selection.currentIndex, entrytree.columns.getColumnAt(0));

    if (strEntryColumn == "modified")
    {
        if (strEntrySortDirection == "DESC")
        {
            strEntrySortDirection = "ASC";
            document.getElementById("sort_modified").src = "chrome://kneemail/skin/images/sort_asc.png"
        }
        else
        {
            strEntrySortDirection = "DESC";
            document.getElementById("sort_modified").src = "chrome://kneemail/skin/images/sort_desc.png"
        }
        
        LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
    }
    else
    {
        document.getElementById("sort_subject").src = "";
        document.getElementById("sort_created").src = "";
        
        strEntryColumn = "modified";
        strEntrySortDirection = "DESC";
        
        document.getElementById("sort_modified").src = "chrome://kneemail/skin/images/sort_desc.png"

        LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
    }
    
    Kneemail.preferences.setCharPref("kneemail.entries.sort.column", strEntryColumn);
    Kneemail.preferences.setCharPref("kneemail.entries.sort.direction", strEntrySortDirection);

    for (var i=0; i<entrytree.view.rowCount; i++)
    {
        if (selected == entrytree.view.getCellValue(i, entrytree.columns.getColumnAt(0)))
        {
            entrytree.view.selection.select(i);
            break;
        }
    }
}

// Loads the entries of the selected folder.
function LoadEntries(folder_id)
{
    var blnShowSplash = true;
        
    try
    {      
        // Clear All Children
        var treechildren = document.getElementById("entry_children");
        while(treechildren.hasChildNodes())
            treechildren.removeChild(treechildren.firstChild);
        
        KneemailDB.open();

        var folder = KneemailDB.getFolder(folder_id, strEntryColumn, strEntrySortDirection);
        
        for (var i=0; i<folder.entries.length; i++)
        {
            blnShowSplash = false;
            
            var objTreeItem = document.createElement("treeitem");
            var objTreeRow = document.createElement("treerow");
            var objTreeCellStatus = document.createElement("treecell");
            var objTreeCellSubject = document.createElement("treecell");
            var objTreeCellCreated = document.createElement("treecell");
            var objTreeCellModified = document.createElement("treecell");
            
            switch (folder.entries[i].status)
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
            
            objTreeCellStatus.setAttribute("value", folder.entries[i].id);
            
            objTreeCellSubject.setAttribute("label", folder.entries[i].subject);
            
            objTreeCellCreated.setAttribute("label", (new Date(folder.entries[i].created)).toKneemailString());
            
            objTreeCellModified.setAttribute("label", (new Date(folder.entries[i].modified)).toKneemailString());
            
            objTreeRow.appendChild(objTreeCellStatus);
            objTreeRow.appendChild(objTreeCellSubject);
            objTreeRow.appendChild(objTreeCellCreated);
            objTreeRow.appendChild(objTreeCellModified);
            objTreeRow.setAttribute("id", folder.entries[i].id);
            
            objTreeItem.appendChild(objTreeRow);
            
            treechildren.appendChild(objTreeItem);
        }
        
        ClearStatusNotification();
        NumberofEntries();
    }
    catch (e)
    {Utils.Err (e, "kneemail.js", "LoadEntries()");}
    finally
    {
        KneemailDB.close();
    }

    if (blnShowSplash)
    {        
        document.getElementById("cmd_delete_entry").setAttribute("disabled", true);
        document.getElementById("cmd_edit_entry").setAttribute("disabled", true);
        document.getElementById("cmd_answered_entry").setAttribute("disabled", true);
        document.getElementById("cmd_edit_entry_prayer_plan").setAttribute("disabled", true);
        document.getElementById("cmd_print_entry").setAttribute("disabled", true);
        document.getElementById("entry_tree").hidden = true;
        document.getElementById("entry_splitter").hidden = true;
        ShowSplash();
    }
    else
    {
        document.getElementById("entry_tree").hidden = false;
        document.getElementById("entry_splitter").hidden = false;
    }
}

// Opens the compose screen to edit the entry.
function EditEntry(entry, folder, action)
{
    var tree = document.getElementById("entry_tree");
    var selected = tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0));
    window.openDialog("chrome://kneemail/content/compose.xul", "compose", "modal,centerscreen", entry, folder, action);
    LoadEntries(folder);
    
    for (var i=0; i<tree.view.rowCount; i++)
    {
        if (selected == tree.view.getCellValue(i, tree.columns.getColumnAt(0)))
        {
            tree.view.selection.select(i);
            break;
        }
    }
}

// Changes the main window's title to the journal title
function SetJournalTitle()
{
    document.title = Kneemail.getKneemailString("KNEEMAIL_TITLE");
}

// Processes the ctlEntry documents
function ProcessPreview()
{
    switch (document.getElementById("preview").contentTitle)
    {
        case "Splash":
            ProcessSplash();
            break;
        
        case "Entry":
            ProcessEntry();
            break;
    }
}

// Populates the Prayer Plan Command Button
function PopulatePrayerPlans()
{
    var prayerplans = document.getElementById("journal_toolbar_prayer_plan_menu");
    while (prayerplans.hasChildNodes())
        prayerplans.removeChild(prayerplans.firstChild);

    try
    {
        KneemailDB.open();

         // Create SELECT statement to retrieve root folders.
        var statement = KneemailDB.statement("SELECT * FROM prayerplans ORDER BY name");
        
        // Enumerate through dataset
        while (statement.executeStep())
        {
            var menuItem = document.createElement("menuitem");
            menuItem.setAttribute("oncommand", "LaunchPrayerPlan(" + statement.getInt64(0) + ");");
            menuItem.setAttribute("label", statement.getUTF8String(1));
            prayerplans.appendChild(menuItem);
        }
    }
    catch (e)
    {Untils.Err (e, "kneemail.js", "PopulatePrayerPlans()");}
    finally
    {
        statement.finalize();
        KneemailDB.close();
        
        prayerplans.appendChild(document.createElement("menuseparator"));
        var editPrayerPlans = document.createElement("menuitem");
        editPrayerPlans.setAttribute("command", "cmd_edit_prayer_plans");
        editPrayerPlans.setAttribute("label", "Edit Prayer Plans");
        prayerplans.appendChild(editPrayerPlans);
    }
}

// Launch Prayer Plan that was Clicked
function LaunchPrayerPlan(id)
{
    if (blnPrayerPlan && id == 0)
    {
        blnPrayerPlan = false;
    }
    else
    {
        var entryTree = document.getElementById("entry_tree");
        
        var selected = 0;
        try
        {
            selected = entryTree.view.getCellValue(entryTree.view.selection.currentIndex, entryTree.columns.getColumnAt(0));
        }
        catch (e)
        {}

        window.openDialog("chrome://kneemail/content/prayer_plan.xul", "prayer_plan", "modal,centerscreen", id);
        
        if (id == 0)
            blnPrayerPlan = false;
        else
            blnPrayerPlan = true;
    
        try
        {
            var tree = document.getElementById("folder_tree");
            LoadEntries(tree.view.getCellValue(tree.view.selection.currentIndex, tree.columns.getColumnAt(0)));
    
            for (var i=0; i<entryTree.view.rowCount; i++)
            {
                if (selected == entryTree.view.getCellValue(i, entryTree.columns.getColumnAt(0)))
                {
                    entryTree.view.selection.select(i);
                    break;
                }
            }
        }
        catch (e)
        {Untils.Err (e, "kneemail.js", "LaunchPrayerPlan()");}
    }
}

// OnCommand Event for working offline/online
function OnCmdOffline()
{
    BrowserOffline.toggleOfflineStatus();
    document.getElementById("cmd_offline").setAttribute("checked", Kneemail.io_service.offline);
}

// OnCommand Event for Go Back
function OnCmdGoBack()
{
    document.getElementById("browser").goBack();
}

// OnCommand Event for Go Forward
function OnCmdGoForward()
{
    document.getElementById("browser").goForward();
}

// OnCommand Event for Reload
function OnCmdReload()
{
    document.getElementById("browser").reload();
}

// OnCommand Event for Stop
function OnCmdStop()
{
    document.getElementById("browser").stop();
}

// OnCommand Event for Go Home
function OnCmdGoHome()
{
    document.getElementById("browser").goHome();
}

// OnCommand Event for go
function OnCmdGo()
{
    document.getElementById("browser").loadURI(document.getElementById("address").value, null, null);
}

// OnCommand Event for the Default Browser Go Button
function OnCmdDefaultBrowser()
{
    OpenURI(document.getElementById("address").value);
}

// Sets the current Kneemail Online page as the home page
function OnCmdOnlineSetHome()
{
    Kneemail.preferences.setCharPref("kneemail.online.home", strOnlineAddress);
    document.getElementById("browser").homePage = strOnlineAddress;
}

// OnKeyPress Event for Web Address
function OnOnlineAddressKeyPress(event)
{
    if (event.keyCode == 13)
    {
        OnCmdGo();
        document.getElementById("address").select();
    }
}

// OnCommand Event for Go Back
function OnCmdSearchGoBack()
{
    document.getElementById("search_browser").goBack();
}

// OnCommand Event for Go Forward
function OnCmdSearchGoForward()
{
    document.getElementById("search_browser").goForward();
}

// OnCommand Event for Reload
function OnCmdSearchReload()
{
    document.getElementById("search_browser").reload();
}

// OnCommand Event for Stop
function OnCmdSearchStop()
{
    document.getElementById("search_browser").stop();
}

// Shows the URL of a link under the cursor
function OverLink(event)
{
    t = event.target;
    while (t && t.docName != "#document")
    {
        if (t.href && t.href.length > 0)
        {
            SetStatusNotification(t.href);
            return t.href;
        }
        else
        {
            t = t.parentNode;
        }
    }
    return false;
}

// Resets the status bar after moving off of a link
function OffLink (event)
{
    t = event.target;
    while (t && t.docName != "#document")
    {
        if (t.href && t.href.length > 0)
        {
            ClearStatusNotification();
            return t.href;
        }
        else
        {
            t = t.parentNode;
        }
    }
    return false;
}

// Captures the mouse click on links
function ClickLink(event)
{
    t = event.target;
    while (t && t.docName != "#document")
    {
        if (t.href && t.href.length > 0)
        {
            switch (t.target)
            {
                case "_blank":
                    t.loadURI(t.href, null, null);
                    break;
            }
            return t.href;
        }
        else
        {
            t = t.parentNode;
        }
    }
    return false;
}
//
//// Loads the Online Search engines
//function LoadOnlineSearch()
//{
//    var menu = document.getElementById("online_search_menu");
//    
//    for (var i=0; i<OnlineSearch.length; i++)
//    {
//        var menuitem = document.createElement("menuitem");
//        menuitem.setAttribute("id", i);
//        menuitem.setAttribute("class", "menuitem-iconic");
//        menuitem.setAttribute("image", OnlineSearch.image(i));
//        menuitem.setAttribute("label", OnlineSearch.text(i));
//        menuitem.tooltipText = OnlineSearch.tooltip(i);
//        menuitem.setAttribute("oncommand", "OnOnlineSearchSelect(this.id);");
//        
//        menu.appendChild(menuitem);
//    }
//    
//    /*var toolbarButton = document.getElementById("online_search_toolbar");
//    toolbarButton.setAttribute("image", OnlineSearch.image(OnlineSearch.selectedIndex));
//    toolbarButton.tooltipText = OnlineSearch.tooltip(OnlineSearch.selectedIndex);
//    
//    document.getElementById("search_text").value = OnlineSearch.text(OnlineSearch.selectedIndex);*/
//    
//    var toolbarMenu = document.getElementById("online_search_toolbar");
//    toolbarMenu.setAttribute("image", OnlineSearch.image(OnlineSearch.selectedIndex));
//    toolbarMenu.tooltipText = OnlineSearch.tooltip(OnlineSearch.selectedIndex);
//    toolbarMenu.setAttribute("label", OnlineSearch.text(OnlineSearch.selectedIndex));    
//    document.getElementById("search_text").value = OnlineSearch.text(OnlineSearch.selectedIndex);
//    document.getElementById("search_description").appendChild(document.createTextNode(OnlineSearch.description()));
//}
//
//// Sets the selected Online Search engine
//function OnOnlineSearchSelect(index)
//{
//    OnlineSearch.selectedIndex = index;
//    
//    var toolbarMenu = document.getElementById("online_search_toolbar");
//    toolbarMenu.setAttribute("image", OnlineSearch.image(OnlineSearch.selectedIndex));
//    toolbarMenu.tooltipText = OnlineSearch.tooltip(OnlineSearch.selectedIndex);
//    toolbarMenu.setAttribute("label", OnlineSearch.text(OnlineSearch.selectedIndex));
//    
//    document.getElementById("search_description").removeChild(document.getElementById("search_description").firstChild);
//    document.getElementById("search_description").appendChild(document.createTextNode(OnlineSearch.description()));
//
//    var onlineSearchTextbox = document.getElementById("search_text");
//    if (onlineSearchTextbox.getAttribute("class") == "search_text_watermark")
//        onlineSearchTextbox.value = OnlineSearch.text(OnlineSearch.selectedIndex);
//}
//
//// OnFocus Event for Online Search
//function OnOnlineSearchFocus()
//{
//    var onlineSearchTextbox = document.getElementById("search_text");
//    if (onlineSearchTextbox.getAttribute("class") == "search_text_watermark")
//    {
//        onlineSearchTextbox.setAttribute("class", "search_text_plain");
//        onlineSearchTextbox.value = "";
//    }
//}
//
//// OnBlur Event for Online Search
//function OnOnlineSearchBlur()
//{
//    var onlineSearchTextbox = document.getElementById("search_text");
//    if (onlineSearchTextbox.getAttribute("class") == "search_text_plain" && onlineSearchTextbox.value == "")
//    {
//        onlineSearchTextbox.setAttribute("class", "search_text_watermark");
//        onlineSearchTextbox.value = OnlineSearch.text(OnlineSearch.selectedIndex);
//    }
//}
//
//// OnCommand Event for Online Search
//function OnCmdOnlineSearch()
//{
//    var onlineSearchTextbox = document.getElementById("search_text");
//    if (onlineSearchTextbox.getAttribute("class") == "search_text_plain" && onlineSearchTextbox.value != "")
//    {
//        document.getElementById("search_browser").loadURI(OnlineSearch.query(onlineSearchTextbox.value), null, null);
//    }
//}
//
//// OnKeyPress Event for Online Search
//function OnOnlineSearchKeyPress(event)
//{
//    if (event.keyCode == 13) OnCmdOnlineSearch();
//}

// Shows the browser is online or offline
function OnlineOffline()
{
    document.getElementById("cmd_offline").setAttribute("checked", Kneemail.io_service.offline);

    if(Kneemail.io_service.offline)
    {
        if (Kneemail.preferences.getBoolPref("kneemail.online.show"))
            document.getElementById("browser").loadURI("chrome://kneemail/content/offline.html", null, null);

        if (Kneemail.preferences.getBoolPref("kneemail.search.show"))
            document.getElementById("search_browser").loadURI("chrome://kneemail/content/offline.html", null, null);
    }
    else
    {
        if (Kneemail.preferences.getBoolPref("kneemail.online.show"))
        {
            document.getElementById("browser").loadURI("chrome://kneemail/content/online.html", null, null);
            window.setTimeout("document.getElementById('browser').goHome();", 3000);
        }

        if (Kneemail.preferences.getBoolPref("kneemail.search.show"))
            document.getElementById("search_browser").goBack();
    }
}

// nsIWebProgressListener interface for the browser
var browserProgressListener = { 
    stateIsRequest:false,
    QueryInterface : function(aIID)
    {
        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports))
                return this;
        throw Components.results.NS_NOINTERFACE;
    },
    
    onStateChange : function(aWebProgress, aRequest, aFlag, aStatus)
    {
        if (!aWebProgress.isLoadingDocument)
            PageLoaded();
        return 0;
    },

    onLocationChange : function(aWebProgress, aRequest, aLocation)
    {
        strOnlineAddress = aLocation.prePath + aLocation.path;
        PageLoaded();
        return 0;
    },
    
    onProgressChange : function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress)
    {
        strKneemailOnline = document.getElementById("browser").contentTitle;
        if(document.getElementById("kneemail_online").style.backgroundImage.indexOf("header_selected.png") != -1)
            document.getElementById("right_header").value = strKneemailOnline;
    },
    
    onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage)
    {
        if (aWebProgress.isLoadingDocument)
        {
            document.getElementById("menubar_throbber").setAttribute("class", "throbber_throbbing");
            SetStatusNotification(aMessage);
            document.getElementById("cmd_stop").removeAttribute("disabled");
            document.getElementById("cmd_reload").setAttribute("disabled", "true");
        }
        else
        {
            ClearStatusNotification();
        }
    },
    
    onSecurityChange : function(aWebProgress, aRequest, aState)
    {},
    
    onLinkIconAvailable : function(a){}
};

// OnLoad listener for the browser
var onLoadBrowser = {
    init: function()
    {
        var browser = document.getElementById("browser");
        if(browser)
        {
            browser.addEventListener("DOMContentLoaded", this.onPageLoad, true);
        }
    },

    onPageLoad: function(aEvent)
    {
        var doc = aEvent.originalTarget;
        if(doc)
        {
            PageLoaded();
        }
    }
}

// Call this when the page is loaded
function PageLoaded()
{
    ClearStatusNotification();
    
    document.getElementById("menubar_throbber").setAttribute("class", "throbber_stopped");
    
    document.getElementById("cmd_reload").removeAttribute("disabled");
    document.getElementById("cmd_stop").setAttribute("disabled", "true");

    if (document.getElementById("browser").canGoBack)
        document.getElementById("cmd_back").removeAttribute("disabled");
    else
        document.getElementById("cmd_back").setAttribute("disabled", "true");
        
    if (document.getElementById("browser").canGoForward)
        document.getElementById("cmd_forward").removeAttribute("disabled");
    else
        document.getElementById("cmd_forward").setAttribute("disabled", "true");
}
//
//// nsIWebProgressListener interface for the search browser
//var searchBrowserProgressListener = { 
//    stateIsRequest:false,
//    QueryInterface : function(aIID)
//    {
//        if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
//            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
//            aIID.equals(Components.interfaces.nsISupports))
//                return this;
//        throw Components.results.NS_NOINTERFACE;
//    },
//    
//    onStateChange : function(aWebProgress, aRequest, aFlag, aStatus)
//    {
//        if (!aWebProgress.isLoadingDocument)
//            SearchPageLoaded();
//        return 0;
//    },
//
//    onLocationChange : function(aWebProgress, aRequest, aLocation)
//    {
//        SearchPageLoaded();
//        return 0;
//    },
//    
//    onProgressChange : function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress)
//    {
//        SetSearchTitle();
//    },
//    
//    onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage)
//    {
//        if (aWebProgress.isLoadingDocument)
//        {
//            document.getElementById("search_tab").image = "chrome://kneemail/skin/images/Throbber-small.gif";
//            SetStatusNotification(aMessage);
//            document.getElementById("cmd_search_stop").removeAttribute("disabled");
//            document.getElementById("cmd_search_reload").setAttribute("disabled", "true");
//        }
//        else
//        {
//            ClearStatusNotification();
//        }
//    },
//    
//    onSecurityChange : function(aWebProgress, aRequest, aState)
//    {
//        /*if (aState == 4)
//        {
//            Element("SecurityState").image = "";
//            Element("txtWebAddress").inputField.style.backgroundColor ="#FFFFFF";
//        }
//        else if (aState == 1)
//        {
//            Element("SecurityState").image = "chrome://kneemail/skin/images/broken.png";
//            Element("txtWebAddress").inputField.style.backgroundColor ="#FF99FF";
//        }
//        else if (aState > 4)
//        {
//            Element("SecurityState").image = "chrome://kneemail/skin/images/secure.png";
//            Element("txtWebAddress").inputField.style.backgroundColor ="#FFFF99";
//        }
//        else
//        {
//            Element("SecurityState").image = "";
//            Element("txtWebAddress").inputField.style.backgroundColor ="#FFFFFF";
//        }*/
//    },
//    
//    onLinkIconAvailable : function(a){}
//};
//
//// OnLoad listener for the search browser
//var onLoadSearchBrowser = {
//    init: function()
//    {
//        var browser = document.getElementById("search_browser");
//        if(browser)
//        {
//            browser.addEventListener("DOMContentLoaded", this.onPageLoad, true);
//        }
//    },
//
//    onPageLoad: function(aEvent)
//    {
//        var doc = aEvent.originalTarget;
//        if(doc)
//        {
//            SearchPageLoaded();
//        }
//    }
//}
//
//// Call this when the search page is loaded
//function SearchPageLoaded()
//{
//    ClearStatusNotification();
//    
//    document.getElementById("cmd_search_reload").removeAttribute("disabled");
//    document.getElementById("cmd_search_stop").setAttribute("disabled", "true");
//
//    if (document.getElementById("search_browser").canGoBack)
//        document.getElementById("cmd_search_back").removeAttribute("disabled");
//    else
//        document.getElementById("cmd_search_back").setAttribute("disabled", "true");
//        
//    if (document.getElementById("search_browser").canGoForward)
//        document.getElementById("cmd_search_forward").removeAttribute("disabled");
//    else
//        document.getElementById("cmd_search_forward").setAttribute("disabled", "true");
//    
//    document.getElementById("search_tab").image = "chrome://kneemail/skin/images/onlinesearch.png";
//}

// Checks to see if a new version is out at startup.
function CheckForUpdateStartup()
{
    SetStatusNotification(Kneemail.getKneemailString("CHECK_FOR_UPDATE"));
    
    var request = new XMLHttpRequest();
    // request.open("GET", "https://kneemail.googlecode.com/files/kneemail_" + Kneemail.getKneemailString("KNEEMAIL_BUILD") + "_update_windows.xml", true);
    request.open("GET", "https://kneemail.googlecode.com/files/kneemail_" + Kneemail.getKneemailString("KNEEMAIL_BUILD") + "_update_windows.txt", true);
    request.onload = CheckForUpdateStartupOnLoad;
    request.send(null);
}

// Actions to perform when the update check loads the XML document.
function CheckForUpdateStartupOnLoad(e)
{
    if (e.target.responseText.indexOf("404 Not Found") == -1)
        document.getElementById("menubar_update").hidden = false;
        
        // Components.classes['@mozilla.org/updates/update-prompt;1'].getService(Components.interfaces.nsIUpdatePrompt).checkForUpdates();
        
    ClearStatusNotification();
}

// Checks to see if a new version is out when the menu item is clicked.
function CheckForUpdate()
{
    // Components.classes['@mozilla.org/updates/update-prompt;1'].getService(Components.interfaces.nsIUpdatePrompt).checkForUpdates();
    
    Utils.OpenURI('http://desktop.kneemailcentral.com');
}

// Backup the kneemail.kdb database.
function Backup()
{
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, Kneemail.getKneemailString("BACKUP_SELECT_FOLDER"), nsIFilePicker.modeSave);
    fp.displayDirectory = DirUtils.getDir(Kneemail.backup_path);
    fp.appendFilter("Zip Files", "*.zip");
    var r = fp.show();

    if (r == nsIFilePicker.returnOK || r == nsIFilePicker.returnReplace)
    {
        try
        {
            Kneemail.backup_path = fp.file.parent.path + DirUtils.separator;
            var strBackup = fp.file.path;
            var zipWriter = Components.classes["@mozilla.org/zipwriter;1"].createInstance(Components.interfaces.nsIZipWriter);
            
            if (strBackup.indexOf(".zip") == -1)
                strBackup += ".zip";
            
            zipWriter.open(FileUtils.getFile(strBackup), 0x04 | 0x08 | 0x20);
            zipWriter.comment = "This is a Kneemail database backup file.";
            zipWriter.addEntryFile(Kneemail.database_filename, Components.interfaces.nsIZipWriter.COMPRESSION_BEST, FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename), false);
            zipWriter.close();
        }
        catch (e)
        {Untils.Err (e, "common.js", "Backup()");}
    }
}

// Restore the kneemail.kdb database.
function Restore()
{
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, Kneemail.getKneemailString("BACKUP_SELECT_FOLDER"), nsIFilePicker.modeOpen);
    fp.displayDirectory = DirUtils.getDir(Kneemail.backup_path);
    fp.appendFilter("Zip Files", "*.zip");
    var r = fp.show();
    if (r == nsIFilePicker.returnOK)
    {
        try
        {
            Kneemail.backup_path = fp.file.parent.path + DirUtils.separator;
            var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"].createInstance(Components.interfaces.nsIZipReader);
            zipReader.open(FileUtils.getFile(fp.file.path));
            zipReader.extract(Kneemail.database_filename, FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
            zipReader.close();
            FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename).permissions = 384;
        }
        catch (e)
        {Untils.Err (e, "common.js", "Restore()");}
    }
}

// Drag Folder observer
var folderObserver = {
    onDragStart: function (event , transferData, action)
    {
        var tree = document.getElementById("folder_tree");
        var idList = "";
        var rangeCount = tree.view.selection.getRangeCount();
        for(var i=0; i<rangeCount; i++)
        {
            var start = {};
            var end = {};
            tree.view.selection.getRangeAt(i,start,end);
            for(var c=start.value; c<=end.value; c++)
            {
                idList += tree.view.getItemAtIndex(c).firstChild.id + ", ";
            }
        }
        
        if ((idList.lastIndexOf(", ") + 2) == idList.length)
        {
            idList = idList.substring(0, idList.lastIndexOf(", "));
        }
        
        transferData.data=new TransferData();
        transferData.data.addDataForFlavour("kneemail/folder", idList);
    }
};

// Drag Entry observer
var entryObserver = {
    onDragStart: function (event , transferData, action)
    {
        var tree = document.getElementById("entry_tree");
        var idList = "";
        var rangeCount = tree.view.selection.getRangeCount();
        for(var i=0; i<rangeCount; i++)
        {
            var start = {};
            var end = {};
            tree.view.selection.getRangeAt(i,start,end);
            for(var c=start.value; c<=end.value; c++)
            {
                idList += tree.view.getItemAtIndex(c).firstChild.id + ", ";
            }
        }
        
        if ((idList.lastIndexOf(", ") + 2) == idList.length)
        {
            idList = idList.substring(0, idList.lastIndexOf(", "));
        }
        
        transferData.data=new TransferData();
        transferData.data.addDataForFlavour("kneemail/entry", idList);
    }
};

// Drop Folder observer
var folderDropObserver = {
    getSupportedFlavours : function ()
    {
        var flavours = new FlavourSet();
        flavours.appendFlavour("kneemail/folder");
        flavours.appendFlavour("kneemail/entry");
        return flavours;
    },
    
    onDragOver : function (event, flavour, session)
    {},
    
    onDrop : function (event, dropdata, session)
    {
        if (dropdata.data != "" && dropdata.flavour.contentType == "kneemail/entry")
        {
            var tree = document.getElementById("folder_tree");
            if (tree.treeBoxObject.getRowAt(event.pageX, event.pageY) > -1)
            {
                // Open connection to Kneemail Database File.
                var dbConn = Kneemail.sqlite.openDatabase(FileUtils.getFile(Kneemail.database_path + Kneemail.database_filename));
                // Move entries to new folder.
                dbConn.executeSimpleSQL("UPDATE entries SET folder = " + tree.view.getCellValue(tree.treeBoxObject.getRowAt(event.pageX, event.pageY), tree.columns.getColumnAt(0)) + " WHERE id IN (" + dropdata.data + ")");
                
                // Close connection.
                dbConn.close();
                
                tree.view.selection.select(tree.treeBoxObject.getRowAt(event.pageX, event.pageY));
            }
        }
        else if(dropdata.data != "" && dropdata.flavour.contentType == "kneemail/folder")
            alert("Cool!");
    }
};

// Shows the Kneemail splash page in the preview pane.
function ShowSplash()
{
    // document.getElementById("entries_header").value = Kneemail.getKneemailString("KNEEMAIL_DB_ENTRIES");
    document.getElementById("preview_subject").hidden = true;
    document.getElementById("preview_labels").hidden = true;
    document.getElementById("preview_dates").hidden = true;
    
    document.getElementById("preview_created").hidden = true;
    document.getElementById("preview_modified").hidden = true;
    document.getElementById("preview_answered").hidden = true;
    
    document.getElementById("cmd_delete_entry").setAttribute("disabled", true);
    document.getElementById("cmd_edit_entry").setAttribute("disabled", true);
    document.getElementById("cmd_answered_entry").setAttribute("disabled", true);
    document.getElementById("cmd_edit_entry_prayer_plan").setAttribute("disabled", true);
    document.getElementById("cmd_print_entry").setAttribute("disabled", true);

    document.getElementById("preview").contentWindow.location.href = "chrome://kneemail/content/splash.html";
}

// Processes the Splash screen
function ProcessSplash()
{
    var intPrayers;
    var intAnsweredPrayers;
    var intPraises;
    var intGeneral;
    var intInactive;
    var intTotal;
    var ctlPreview = document.getElementById("preview");
    
    ctlPreview.contentDocument.getElementById("welcome").innerHTML = "Welcome to " + Kneemail.getKneemailString("KNEEMAIL_TITLE") + "!";
    ctlPreview.contentDocument.getElementById("version").innerHTML = "Version " + Kneemail.getKneemailString("KNEEMAIL_VERSION");
    ctlPreview.contentDocument.getElementById("prayers_label").innerHTML = Kneemail.getKneemailString("SPLASH_PRAYER_REQUESTS");
    ctlPreview.contentDocument.getElementById("answers_label").innerHTML = Kneemail.getKneemailString("SPLASH_ANSWERED");
    ctlPreview.contentDocument.getElementById("praises_label").innerHTML = Kneemail.getKneemailString("SPLASH_PRAISES");
    ctlPreview.contentDocument.getElementById("general_label").innerHTML = Kneemail.getKneemailString("SPLASH_GENERAL");
    ctlPreview.contentDocument.getElementById("inactive_label").innerHTML = Kneemail.getKneemailString("SPLASH_INACTIVE");
    ctlPreview.contentDocument.getElementById("total_label").innerHTML = Kneemail.getKneemailString("SPLASH_TOTAL");
    
    try
    {
        KneemailDB.open();
        
        var statement = KneemailDB.statement("SELECT COUNT(*) FROM entries WHERE type = 0 AND status = 0");
        statement.executeStep();
        intPrayers = statement.getInt64(0);
        statement.finalize();
        
        statement = KneemailDB.statement("SELECT COUNT(*) FROM entries WHERE type = 0 AND status = 1");
        statement.executeStep();
        intAnsweredPrayers = statement.getInt64(0);
        statement.finalize();
        
        statement = KneemailDB.statement("SELECT COUNT(*) FROM entries WHERE type = 1 AND status = 0");
        statement.executeStep();
        intPraises = statement.getInt64(0);
        statement.finalize();
        
        statement = KneemailDB.statement("SELECT COUNT(*) FROM entries WHERE type = 2 AND status = 0");
        statement.executeStep();
        intGeneral = statement.getInt64(0);
        statement.finalize();
        
        statement = KneemailDB.statement("SELECT COUNT(*) FROM entries WHERE status = 2");
        statement.executeStep();
        intInactive = statement.getInt64(0);
        statement.finalize();
        
        statement = KneemailDB.statement("SELECT COUNT(*) FROM entries");
        statement.executeStep();
        intTotal = statement.getInt64(0);
    }
    catch (e)
    {
        // Utils.Err(e, "kneemail.js", "ProcessSplash()");
        Kneemail.prompts.alert(null, Kneemail.getKneemailString("KNEEMAIL_TITLE"), Kneemail.getKneemailString("KNEEMAIL_DB_NOT_FOUND"));
    }
    finally
    {
        // Finalize statement.
        statement.finalize();
        // Close connection.
        KneemailDB.close();
    }

    ctlPreview.contentDocument.getElementById("prayers_count").innerHTML = intPrayers;
    ctlPreview.contentDocument.getElementById("answers_count").innerHTML = intAnsweredPrayers;
    ctlPreview.contentDocument.getElementById("praises_count").innerHTML = intPraises;
    ctlPreview.contentDocument.getElementById("general_count").innerHTML = intGeneral;
    ctlPreview.contentDocument.getElementById("inactive_count").innerHTML = intInactive;
    ctlPreview.contentDocument.getElementById("total_count").innerHTML = intTotal;
}

// Displays the selected entry in the preview pane.
function ShowEntry()
{
    if (document.getElementById("entry_children").childNodes.length > 0)
    {
        document.getElementById("preview_subject").hidden = false;
        document.getElementById("preview_created").hidden = false;
        document.getElementById("preview_modified").hidden = false;
        
        document.getElementById("cmd_delete_entry").removeAttribute("disabled");
        document.getElementById("cmd_edit_entry").removeAttribute("disabled");
        document.getElementById("cmd_answered_entry").removeAttribute("disabled");
        document.getElementById("cmd_edit_entry_prayer_plan").removeAttribute("disabled");
        document.getElementById("cmd_print_entry").removeAttribute("disabled");
    }
    
    document.getElementById("preview").contentWindow.location.href = "chrome://kneemail/content/show_entry.html";
}

// Processes the Entry Preview
function ProcessEntry()
{
    try
    {
        var entryTree = document.getElementById("entry_tree");
        var id = entryTree.view.getCellValue(entryTree.view.selection.currentIndex, entryTree.columns.getColumnAt(0));

        try
        {
            KneemailDB.open();

            var entry = KneemailDB.getEntry(id);
    
            var ctlPreview = document.getElementById("preview");
        
            if (entry.entry != "")
                ctlPreview.contentDocument.getElementById("entry").innerHTML = "<b>" + Kneemail.getKneemailString("PRINT_ENTRY") + "</b><br />" + entry.entry;
                
            if(entry.type == 0 && entry.answer != "")
                ctlPreview.contentDocument.getElementById("answer").innerHTML = "<br /><br /><b>" + Kneemail.getKneemailString("PRINT_ANSWER") + "</b><br />" + entry.answer;
            
            if(entry.scripture != "")
                ctlPreview.contentDocument.getElementById("scripture").innerHTML = "<br /><br /><b>" + Kneemail.getKneemailString("PRINT_SCRIPTURE") + "</b><br />" + entry.scripture;
            
            var strImages = "";
            for (var i=0; i<entry.images.length; i++)
            {
                strImages += "             <img src=\"" + entry.images[i] + "\" /><br />";
            }
    
            if (strImages != "")
            {
                ctlPreview.contentDocument.getElementById("images").innerHTML = strImages;
            }
        }
        catch (e)
        {Utils.Err (e, "kneemail.js", "ProcessEntry()");}
        finally
        {
            KneemailDB.close();
        }
    
        document.getElementById("subject_header").value = entry.subject;
        // document.getElementById("subject_label").value = entry.subject;
        
        document.getElementById("preview_labels").hidden = false;
        document.getElementById("preview_dates").hidden = false;
        
        document.getElementById("created_label").hidden = false;
        document.getElementById("created_label").value = (new Date(entry.created)).toKneemailString();
        
        document.getElementById("modified_label").hidden = false;
        document.getElementById("modified_label").value = (new Date(entry.modified)).toKneemailString();
        
        if(entry.type == 0 && entry.answered != 0 && entry.answered != "null")
        {
            document.getElementById("answered_label").hidden = false;
            document.getElementById("answered_label").value = (new Date(entry.answered)).toKneemailString();
            document.getElementById("preview_answered").hidden = false;
        }
        else
        {
            document.getElementById("answered_label").hidden = true;
            document.getElementById("preview_answered").hidden = true;
        }
    }
    catch (e)
    {
        // Utils.Err(e, "kneemail.js", "ProcessEntry()");
        ShowSplash();
    }
}

// Puts a message in the notifications status bar panel.
function SetStatusNotification(label)
{
    document.getElementById("status_notifications").label = label;
}

// Puts a message in the notifications status bar panel for the given amount of time.
function SetStatusNotificationTimed(label, time)
{
    if(intNotifications)
    {
        window.clearTimeout(intNotifications);
    }
    
    document.getElementById("status_notifications").label = label;
    intNotifications = window.setTimeout("ClearStatusNotification();", time);
}

// Clears any message in the notifications status bar panel.
function ClearStatusNotification()
{
    document.getElementById("status_notifications").label = Kneemail.getKneemailString("DONE");
}

// Sets the number of entries in the status bar panel.
function NumberofEntries()
{
    document.getElementById("status_entries").label = document.getElementById("entry_children").childNodes.length + " " + Kneemail.getKneemailString("KNEEMAIL_DB_ENTRIES");
}

function quit (aForceQuit)
{
    var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);
    
    // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
    // process if there is unsaved data. eForceQuit will quit no matter what.
    var quitSeverity = aForceQuit ? Components.interfaces.nsIAppStartup.eForceQuit : Components.interfaces.nsIAppStartup.eAttemptQuit;
    appStartup.quit(quitSeverity);
}

function restart (aForceQuit)
{
    var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);
    
    // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
    // process if there is unsaved data. eForceQuit will quit no matter what.
    var quitSeverity = aForceQuit ? Components.interfaces.nsIAppStartup.eForceQuit : Components.interfaces.nsIAppStartup.eAttemptQuit;
    appStartup.quit(quitSeverity + Components.interfaces.nsIAppStartup.eRestart);
}