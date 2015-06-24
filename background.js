window.addEventListener("load", init);

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        console.log(details.url);
        if (details.url == "http://agar.io/main_out.js?555")
            return {
                redirectUrl: "http://wikilist.daniguardiola.me/agario.js"
            };
    }, {
        urls: ["<all_urls>"]
    }, ["blocking"]);

function init() {
    checkVersion();
}

function checkVersion() {
    var landingUrl = "http://www.carlosjeurissen.com/black-menu-for-google/landing/index.html";
    var oldVersion = localStorage.getItem("versionNumber");
    var version = chrome.app.getDetails().version;
    var updatedUrl = "http://www.carlosjeurissen.com/black-menu-for-google/landing/index.html?update=" + version;

    if (!oldVersion) {
        openPopup(landingUrl);
    } else if (oldVersion !== version) {
        openPopup(updatedUrl);
    }
    localStorage.setItem("versionNumber", version);
}

function openPopup(url) {
    chrome.tabs.create({
        "url": url
    });
}
