window.addEventListener("load", init);

function init() {
    checkVersion();
}

/**

    Open a popup with url

*/
function openPopup(url) {
    chrome.tabs.create({
        "url": url
    });
}

/**

    Check the extension version.

    - If it has just been installed, open the landing page in a new tab.
    - If it has been updated, open the changelog page in a new tab
    - If it has not been updated, do nothing.

    This opens a popup with relevant information on extension install and update.
    The updates are every two months in average.

*/
function checkVersion() {
    var landingUrl = "http://agario.daniguardiola.me/?installed=true";
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