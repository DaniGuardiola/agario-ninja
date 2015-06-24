"use strict";
// Declare the API
var api = (function(window) {
    // Tools:
    // Triggers a key event
    function triggerKeyEvent(charCode, eventName) {
            // TODO: rewrite to define once and fire multiple times
            eventName = eventName || "keydown"; // Useless at the moment
            var s = document.createElement("script");
            s.textContent = "(" + function(charCode) {
                var event = document.createEvent("KeyboardEvents");
                event.initKeyboardEvent(
                    "keydown"
                );
                var getterCode = {
                    get: function() {
                        return charCode;
                    }
                };
                Object.defineProperties(event, {
                    keyCode: getterCode
                });

                window.dispatchEvent(event);
            } + ")(" + charCode + ")";
            (document.head || document.documentElement).appendChild(s);
            s.parentNode.removeChild(s);
        }
        // End of tools

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

    // Disables W action
    function disableW() {
        window.addEventListener("keydown", disableWListener, true);
    }

    // Enables W action
    function enableW() {
        window.removeEventListener("keydown", disableWListener, true);
    }

    // Listener that prevents W
    function disableWListener(event) {
        var key = event.keyCode || event.which;
        if (key === 87) {
            event.stopPropagation();
            fireW();
        }
    }

    // Fires the W action
    function fireW() {
        triggerKeyEvent(87);
        disableW();
    }

    // Disables space action
    function disableSpace() {
        window.addEventListener("keydown", disableSpaceListener, true);
    }

    // Enables space action
    function enableSpace() {
        window.removeEventListener("keydown", disableSpaceListener, true);
    }

    // Listener that prevents space
    function disableSpaceListener(event) {
        var key = event.keyCode || event.which;
        if (key === 32) {
            event.stopPropagation();
        }
    }

    // Starts the extension
    function start() {
        addListeners();
        addLayer();
        disableW();
        disableSpace();
    }

    // Stops the extension
    function stop() {
        removeListeners();
        removeLayer();
        enableW();
        enableSpace();
    }

    // Publish methods in the api
    return {
        "move": move,
        "moveTo": moveTo,
        "on": start,
        "off": stop
    };
})(window);
api.on();

// #1 fix for CSS not injecting properly
(function() {
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = chrome.extension.getURL("style.css");
    (document.head || document.documentElement).appendChild(style);
})();

// #2 fix
(function() {
    var style = '#extension-layer { position: fixed; width: 100%; height: 100%; z-index: 1; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } ';
    var s = document.createElement("style");
    s.innerHTML = style;
    document.getElementsByTagName("head")[0].appendChild(s);
})();

console.log("Now you can use the keyboard ;D");
