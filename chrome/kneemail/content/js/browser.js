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
    window.addEventListener("DOMContentLoaded", function() { onLoadBrowser.init(); }, false);
    document.getElementsByTagName("browser")[0].addProgressListener(browserProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
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
        document.getElementById("address").value = aLocation.prePath + aLocation.path;
        var pageURI = Kneemail.io_service.newURI(document.getElementById("address").value, null, null);
        var favIconURI = Kneemail.io_service.newURI(document.getElementsByTagName("browser")[0].currentURI.prePath + "/favicon.ico", null, null);
        Kneemail.fav_icons.setAndLoadFaviconForPage(pageURI, favIconURI, false);
        PageLoaded();
        return 0;
    },
    
    onProgressChange : function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress)
    {
        document.title = document.getElementsByTagName("browser")[0].contentTitle;
    },
    
    onStatusChange : function(aWebProgress, aRequest, aStatus, aMessage)
    {
        if (aWebProgress.isLoadingDocument)
        {
            // Element("progress").removeAttribute("hidden");
            document.getElementById("favicon").image = "chrome://kneemail/skin/images/Throbber-small.gif";
            document.getElementById("status_notifications").label = aMessage;
            /*Element("tabResources").image = "chrome://webresources/content/images/Throbber-small.gif";
            SetStatusNotification(aMessage);

            Element("cmdStop").removeAttribute("disabled");
            Element("cmdStop").setAttribute("image", "chrome://webresources/content/images/stop.png");
        
            Element("cmdReload").setAttribute("disabled", "true");
            Element("cmdReload").setAttribute("image", "chrome://webresources/content/images/reload_disabled.png");*/
        }
        else
        {
            // ClearNotification();
        }
    },
    
    onSecurityChange : function(aWebProgress, aRequest, aState)
    {
        /*if (aState == 4)
        {
            Element("SecurityState").image = "";
            Element("txtWebAddress").inputField.style.backgroundColor ="#FFFFFF";
        }
        else if (aState == 1)
        {
            Element("SecurityState").image = "chrome://webresources/content/images/broken.png";
            Element("txtWebAddress").inputField.style.backgroundColor ="#FF99FF";
        }
        else if (aState > 4)
        {
            Element("SecurityState").image = "chrome://webresources/content/images/secure.png";
            Element("txtWebAddress").inputField.style.backgroundColor ="#FFFF99";
        }
        else
        {
            Element("SecurityState").image = "";
            Element("txtWebAddress").inputField.style.backgroundColor ="#FFFFFF";
        }*/
    },
    
    onLinkIconAvailable : function(a){}
};

// OnLoad listener for the browser
var onLoadBrowser = {
    init: function()
    {
        var browser = document.getElementsByTagName("browser")[0];
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
    var links = document.getElementsByTagName("browser")[0].contentDocument.getElementsByTagName("link");
    if (links)
    {
        for (var i in links)
        {
            if (links[i].getAttribute("rel") == "icon")
            {
                var favIconURL = links[i].getAttribute("href");
                
                if (favIconURL)
                {
                    if (favIconURL.indexOf(document.getElementsByTagName("browser")[0].currentURI.prePath) == -1)
                        favIconURL = document.getElementsByTagName("browser")[0].currentURI.prePath + "/" + favIconURL;
                        
                    var pageURI = Kneemail.io_service.newURI(document.getElementById("address").value, null, null);
                    var favIconURI = Kneemail.io_service.newURI(favIconURL, null, null);
                    Kneemail.fav_icons.setAndLoadFaviconForPage(pageURI, favIconURI, false);
                }
            }
            else if (links[i].getAttribute("rel") == "shortcut icon")
            {
                var favIconURL = links[i].getAttribute("href");
                
                if (favIconURL)
                {
                    if (favIconURL.indexOf(document.getElementsByTagName("browser")[0].currentURI.prePath) == -1)
                        favIconURL = document.getElementsByTagName("browser")[0].currentURI.prePath + "/" + favIconURL;
                        
                    var pageURI = Kneemail.io_service.newURI(document.getElementById("address").value, null, null);
                    var favIconURI = Kneemail.io_service.newURI(favIconURL, null, null);
                    Kneemail.fav_icons.setAndLoadFaviconForPage(pageURI, favIconURI, false);
                }
            }
        }
    }
    
    document.getElementById("status_notifications").label = Kneemail.getKneemailString("DONE");
    /*Element("progress").setAttribute("hidden", true);
    SetStatusNotification(Element("KneemailProperties").getString("DONE"));
    Element("throbber").image = "chrome://webresources/content/images/Throbber-small-stopped.png";
    var favIcon = objFavIcon.getFaviconImageForPage(Element("webWebsite").currentURI);
    Element("tabResources").image = favIcon.prePath + favIcon.path;
    Element("tabResources").label = " " + Element("webWebsite").contentTitle;
    strWebTitle = Element("webWebsite").contentTitle;
    SetWebTitle();
    Element("txtWebAddress").inputField.style.backgroundImage = "url(" + favIcon.prePath + favIcon.path + ")";
    
    Element("cmdReload").removeAttribute("disabled");
    Element("cmdReload").setAttribute("image", "chrome://webresources/content/images/reload.png");

    Element("cmdStop").setAttribute("disabled", "true");
    Element("cmdStop").setAttribute("image", "chrome://webresources/content/images/stop_disabled.png");

    EnableDisableGoBack();
    EnableDisableGoForward();*/
    
    var favIcon = Kneemail.fav_icons.getFaviconImageForPage(document.getElementsByTagName("browser")[0].currentURI);
    document.getElementById("favicon").image = favIcon.prePath + favIcon.path;
}