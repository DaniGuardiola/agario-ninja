window.addEventListener("load", init);

/*
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
*/

function init() {
    checkVersion();
}

function openPopup(url) {
    chrome.tabs.create({
        "url": url
    });
}

function checkVersion() {
    var landingUrl = "http://agario.daniguardiola.me/#changes?installed=true";
    var version = chrome.runtime.getManifest().version;
    var updatedUrl;
    chrome.storage.local.get("versionNumber", function(storage) {
        var versionNumber = storage.versionNumber;
        if (!versionNumber) {
            openPopup(landingUrl);
        } else if (versionNumber !== version) {
            updatedUrl = updatedUrl = "http://agario.daniguardiola.me/#changes?update=true&version=" + version;
            openPopup(updatedUrl);
        }
        chrome.storage.local.set({
            "versionNumber": version
        });
    });

}
