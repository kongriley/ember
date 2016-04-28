require('electron-cookies');
var remote = require('remote');
var electron = require('electron');
window.onresize = doLayout;
var isLoading = false;
var woutline = "";

onload = function() {
    loadTab();
    createContextMenus();
}

function blockAds() {
var adblock = require("remove-ads");

document.innerHTML = adblock(document.innerHTML);
}

function loadTab(select=false) {
    var webview = document.querySelector('#content-active webview');
    doLayout();

    document.querySelector('#tab-active').onclick = function() { switchTab(this); };

    document.querySelector('#content-active .back').onclick = function() {
        webview.goBack();
    };

    document.querySelector('#content-active .forward').onclick = function() {
        webview.goForward();
    };

    document.querySelector('#content-active .reload').onclick = function() {
        if (isLoading) {
            webview.stop();
        } else {
            webview.reload();
        }
    };
    document.querySelector('#content-active .reload').addEventListener(
        'webkitAnimationIteration',
        function() {
            if (!isLoading) {
                document.body.classList.remove('loading');
            }
        });

    document.querySelector('#content-active .location-form').onsubmit = function(e) {
        e.preventDefault();
        navigateTo(document.querySelector('#content-active .location').value);
    };

    webview.addEventListener('close', handleExit);
    webview.addEventListener('did-start-loading', handleLoadStart);
    webview.addEventListener('did-stop-loading', handleLoadStop);
    webview.addEventListener('did-fail-load', handleLoadAbort);
    webview.addEventListener('did-get-redirect-request', handleLoadRedirect);
    webview.addEventListener('did-finish-load', handleLoadCommit);
    webview.addEventListener('new-window', function(e) {
        webview.src = e.url;
    });
    webview.addEventListener('close', function() {
        webview.src = 'about:blank';
    });
    webview.addEventListener("ipc-message", function(e) {
        console.log(e.args[0].outline);
        woutline = e.args[0].outline;
    });
};

function navigateTo(url) {
    var webview = document.querySelector('#content-active webview');
    var r = /^((ht|f)tp(s?)\:\/\/|~\/|\/)?([\w]+:\w+@)?([a-zA-Z]{1}([\w\-]+\.)+([\w]{2,5}))(:[\d]{1,5})?((\/?\w+\/)+|\/?)(\w+\.[\w]{3,4})?((\?\w+=\w+)?(&\w+=\w+)*)?/;
    if (r.test(url)) {
        if (url.indexOf("http") == 0 || url.indexOf("https") == 0 || url.indexOf("ftp") == 0) {
            webview.src = url;
        } else {
            webview.src = "http://" + url;
        }
    } else {
        webview.src = "https://duckduckgo.com/?q=" + encodeURIComponent(url);
    }
}

function doLayout() {
    var webview = document.querySelector('#content-active webview');
    var controls = document.querySelector('#content-active .controls');
    var tabs = document.querySelector('#tabs');
    var controlsHeight = controls.offsetHeight;
    var tabsHeight = tabs.offsetHeight;
    var windowWidth = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;
    var webviewWidth = windowWidth;
    var webviewHeight = windowHeight - controlsHeight - tabsHeight;


    webview.style.width = webviewWidth + 'px';
    webview.style.height = webviewHeight + 'px';
}

function handleExit(event) {
    console.log(event.type);
}

function handleLoadCommit() {
    var webview = document.querySelector('#content-active webview');
    document.querySelector('#content-active .location').value = webview.getURL();
    document.querySelector('#content-active .back').disabled = !webview.canGoBack();
    document.querySelector('#content-active .forward').disabled = !webview.canGoForward();

    document.querySelector('#tab-active .tab-title').innerHTML = webview.getTitle();
}

function handleLoadStart(event) {
    document.body.classList.add('loading');
    isLoading = true;

    if (!event.isTopLevel) {
        return;
    }

    document.querySelector('#content-active .location').value = event.url;
}

function handleLoadStop(event) {
    isLoading = false;
}

function handleLoadAbort(event) {
    console.log('LoadAbort');
    console.log('    url: ' + event.url);
    console.log('    isTopLevel: ' + event.isTopLevel);
    console.log('    type: ' + event.type);
}

function handleLoadRedirect(event) {
    document.querySelector('#content-active .location').value = event.newUrl;
}

function createContextMenus() {
    var Menu = remote.require('menu');
    var MenuItem = remote.require('menu-item');
    var Screen = electron.screen;
    var webview = document.querySelector('#content-active webview');

    var cmenu = new Menu();
    cmenu.append(new MenuItem({
        label: 'Back',
        click: function() {
            webview.goBack();
        }
    }));
    cmenu.append(new MenuItem({
        label: 'Forward',
        click: function() {
            webview.goForward();
        }
    }));
    cmenu.append(new MenuItem({
        type: 'separator'
    }));
    cmenu.append(new MenuItem({
        label: 'Copy',
        role: 'copy',
        accelerator: 'CmdOrCtrl+c'
    }));
    cmenu.append(new MenuItem({
        label: 'Cut',
        role: 'cut',
        accelerator: 'CmdOrCtrl+x'
    }));
    cmenu.append(new MenuItem({
        label: 'Paste',
        role: 'paste',
        accelerator: 'CmdOrCtrl+v'
    }));
    cmenu.append(new MenuItem({
        label: 'Select All',
        role: 'selectall',
        accelerator: 'CmdOrCtrl+a'
    }));
    cmenu.append(new MenuItem({
        type: 'separator'
    }));
    cmenu.append(new MenuItem({
        label: 'Inspect Element',
        click: function () {
            webview.inspectElement(rightClickPosition.x, rightClickPosition.y);
        }
    }));
    window.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        rightClickPosition = {x: e.x, y: e.y}
        cmenu.popup(remote.getCurrentWindow());
    }, false);
}

function newTab() {
    document.querySelector('#tab-active').id = "";

    var tab = document.createElement('div');
    tab.classList.add('tab-item');
    tab.id = 'tab-active';
    tab.innerHTML = '<i class="fa fa-times tab-close" onclick="closeTab(this.parentElement);"></i>\n<span class="tab-title">New Tab</span>'

    document.querySelector('#tabs').insertBefore(tab, document.querySelector('#newtab'));

    document.querySelector('#content-active').id = "";
    var content = document.createElement('div');
    content.classList.add('content-item');
    content.id = 'content-active';
    content.innerHTML = '\
        <div class="controls">\
            <button class="back" title="Go Back" disabled="true"><i class="fa fa-arrow-left"></i></button>\
            <button class="forward" title="Go Forward" disabled="true"><i class="fa fa-arrow-right"></i></button>\
            <button class="reload" title="Reload"><i class="fa fa-refresh"></i></button>\
\
            <form class="location-form">\
                <input class="location" type="text" onclick="this.focus();" onfocus="this.select();">\
            </form>\
        </div>\
\
        <webview src="https://duckduckgo.com" allowpopups disablewebsecurity plugins></webview>';

    document.querySelector('#content').appendChild(content);

    loadTab(true);
}

function closeTab(element) {
    var index = Array.prototype.indexOf.call(document.querySelector('#tabs').children, element);
    if (element.previousElementSibling == null && element.nextElementSibling.id == "newtab") {
        navigateTo("https://duckduckgo.com")
    } else {
        if (element.id == 'tab-active') {
            if (element.previousElementSibling == null) {
                element.nextElementSibling.id = "tab-active";
                document.querySelector('#content').children[index+1].id = "content-active";
            } else {
                element.previousElementSibling.id = "tab-active";
                document.querySelector('#content').children[index-1].id = "content-active";
            }
        }
        element.remove();

        document.querySelector('#content').children[index].remove();
    }
}

function switchTab(element) {
    var index = Array.prototype.indexOf.call(document.querySelector('#tabs').children, element);
    if (index == -1) return;
    document.querySelector('#tab-active').id = "";
    element.id = "tab-active";
    document.querySelector('#content-active').id = "";
    document.querySelector('#content').children[index].id = "content-active";

    loadTab();
}
