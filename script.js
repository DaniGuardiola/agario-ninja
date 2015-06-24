"use strict";
// Declare the API
var api = (function() {
    // Current state of keys
    var keys = [];

    // Last direction
    var lastDirection = "stop";

    // Adds a key to the keys array or
    // moves it down if already included
    function addKey(key) {
        removeKey(key);
        keys.push(key);
    }

    // Removes a key from the keys array
    function removeKey(key) {
        var index = keys.indexOf(key);
        if (index > -1) {
            keys.splice(index, 1);
        }
    }

    // Get canvas
    function getCanvas() {
        return document.getElementById("canvas");
    }

    // Get canvas dimensions
    function getCanvasDimensions() {
        var rect = getCanvas().getBoundingClientRect();
        return {
            "height": rect.height,
            "width": rect.width
        };
    }

    // Get coordinates for direction
    function coordinates(direction) {
        var dim = getCanvasDimensions();
        var xy = {
            "x": dim.width / 2,
            "y": dim.height / 2
        };
        switch (direction) {
            case "up-left":
                xy = {
                    "x": 0,
                    "y": 0
                };
                break;
            case "up":
                xy = {
                    "x": dim.width / 2,
                    "y": 0
                };
                break;
            case "up-right":
                xy = {
                    "x": dim.width,
                    "y": 0
                };
                break;
            case "right":
                xy = {
                    "x": dim.width,
                    "y": dim.height / 2
                };
                break;
            case "down-right":
                xy = {
                    "x": dim.width,
                    "y": dim.height
                };
                break;
            case "down":
                xy = {
                    "x": dim.width / 2,
                    "y": dim.height
                };
                break;
            case "down-left":
                xy = {
                    "x": 0,
                    "y": dim.height
                };
                break;
            case "left":
                xy = {
                    "x": 0,
                    "y": dim.height / 2
                };
                break;
        }
        return xy;
    }

    // Move the player based on coordinates
    function moveTo(x, y) {
        var ev = new MouseEvent("mousemove", {
            clientX: x,
            clientY: y
        });
        getCanvas().dispatchEvent(ev);
    }

    // Move the player based on direction
    function move(direction) {
        lastDirection = direction;
        var co = coordinates(direction);
        if (move === "stop") {
            // Do something!
        }
        moveTo(co.x, co.y);
    }

    // Returns the name of a key based on its number
    function whichKey(number) {
        return ({
            /* WASD
            Disabled until I find a solution
            for the W action
            "65": "left",
            "87": "up",
            "68": "right",
            "83": "down",
            */
            // Arrows
            "37": "left",
            "38": "up",
            "39": "right",
            "40": "down"
        })[number];
    }

    // Key down event listener
    function keyDownListener(event) {
        var key = event.keyCode || event.which;
        key = whichKey(key);
        if (key === false) {
            return;
        }
        addKey(key);
        resolve();
    }

    // Key up event listener
    function keyUpListener(event) {
        var key = event.keyCode || event.which;
        key = whichKey(key);
        if (key === false) {
            return;
        }
        removeKey(key);
        resolve();
    }

    // Resolves movement for current key state
    function resolve() {
        // If no keys
        var direction = "stop";
        var n, last, previous;
        if (keys.length === 1) {
            // If one key
            direction = keys[0];
        } else if (keys.length > 1) {
            // If two or more keys
            n = keys.length - 1;
            last = keys[n];
            previous = keys[n - 1];
            direction = resolveTwo(last, previous);
            if (!direction && keys.length > 2) {
                // If 2 keys didn't work, try with 3
                previous = keys[n - 2];
                direction = resolveTwo(last, previous);
            }
            if (!direction && keys.length > 3) {
                // If 3 keys didn't work, try with 4
                previous = keys[n - 3];
                direction = resolveTwo(last, previous);
            }
            if (!direction) {
                // Nah, didn't work, won't move
                return;
            }
        }
        move(direction);
    }

    // Resolves a combination of two keys
    function resolveTwo(first, second) {
        var direction;
        switch (first) {
            case "up":
                if (second === "left") {
                    direction = "up-left";
                } else if (second === "right") {
                    direction = "up-right";
                } else {
                    direction = false;
                }
                break;
            case "right":
                if (second === "up") {
                    direction = "up-right";
                } else if (second === "down") {
                    direction = "down-right";
                } else {
                    direction = false;
                }
                break;
            case "down":
                if (second === "right") {
                    direction = "down-right";
                } else if (second === "left") {
                    direction = "down-left";
                } else {
                    direction = false;
                }
                break;
            case "left":
                if (second === "down") {
                    direction = "down-left";
                } else if (second === "up") {
                    direction = "up-left";
                } else {
                    direction = false;
                }
                break;
        }
        return direction;
    }

    // Adds event listener
    function addListeners() {
        document.addEventListener("keydown", keyDownListener);
        document.addEventListener("keyup", keyUpListener);
    }

    // Removes event listener
    function removeListeners() {
        document.removeEventListener("keydown", keyDownListener);
        document.removeEventListener("keyup", keyUpListener);
    }

    // Adds a layer between the overlay and the canvas
    // to avoid mousemouse triggered by mouse
    function addLayer() {
        var layer = document.createElement("div");
        layer.id = "extension-layer";
        getCanvas().parentNode.insertBefore(layer, getCanvas());
    }

    // Removes the layer
    function removeLayer() {
        getLayer().parentNode.removeChild(getLayer());
    }

    // Gets the layer
    function getLayer() {
        return document.getElementById("extension-layer");
    }

    // Starts the extension
    function start() {
        addListeners();
        addLayer();
    }

    // Stops the extension
    function stop() {
        removeListeners();
        removeLayer();
    }

    // Publish methods in the api
    return {
        "move": move,
        "moveTo": moveTo,
        "on": start,
        "off": stop
    };
})();
api.on();

// Fix for CSS not injecting properly
(function injectCSS() {
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = chrome.extension.getURL("style.css");
    (document.head || document.documentElement).appendChild(style);
})();

console.log("Now you can use the keyboard ;D");
