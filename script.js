"use strict";
(function(window) {
    // Tools:
    // Triggers a key event
    function triggerKeyEvent(charCode, eventName) {
        eventName = eventName || "keydown";
        var s = document.createElement("script");
        s.textContent = "window.agarioTriggerKey(" + charCode + ", \"" + eventName + "\");";
        (document.head || document.documentElement).appendChild(s);
        s.parentNode.removeChild(s);
    }

    // Adds an agarioTriggerKey method to window
    function addTriggerKeyFunction() {
        var s = document.createElement("script");
        s.textContent = "window.agarioTriggerKey = " + function(charCode, eventName) {
            var event = document.createEvent("KeyboardEvents");
            event.initKeyboardEvent(
                eventName
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
        };
        (document.head || document.documentElement).appendChild(s);
        s.parentNode.removeChild(s);
    }

    // Removes the agarioTriggerKey method from window
    function removeTriggerKeyFunction() {
        window.agarioTriggerKey = null;
    }

    // Current state of keys
    var keys = [];

    // Last direction
    var lastDirection = "stop";

    // Last mouse position
    var lastMousePosition = "stop";

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
        var left = (dim.width - dim.height) / 2;
        var right = dim.height + left;
        switch (direction) {
            case "up-left":
                xy = {
                    "x": left,
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
                    "x": right,
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
                    "x": right,
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
                    "x": left,
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
            /* Arrows
            "37": "left",
            "38": "up",
            "39": "right",
            "40": "down",*/
            // WASD
            "65": "left",
            "87": "up",
            "68": "right",
            "83": "down"
        })[number];
    }

    // Key down event listener
    function keyDownListener(event) {
        var key = event.keyCode || event.which;
        // Stopping W
        if (key === 87) {
            event.stopPropagation();
        }
        key = whichKey(key);
        if (key === undefined) {
            return;
        }
        addKey(key);
        resolve();
    }

    // Key up event listener
    function keyUpListener(event) {
        var key = event.keyCode || event.which;
        // Stopping W
        if (key === 87) {
            event.stopPropagation();
        }
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
    // to avoid mousemove triggered by mouse
    function addLayer() {
        if (getLayer()) {
            return;
        }
        var layer = document.createElement("div");
        layer.id = "extension-layer";
        layer.addEventListener("mousedown", layerMouseDownListener);
        layer.addEventListener("mouseup", layerMouseUpListener);
        layer.addEventListener("mousemove", layerMouseListener);
        getCanvas().parentNode.insertBefore(layer, getCanvas());
    }

    // Removes the layer
    function removeLayer() {
        var layer = getLayer();
        layer.removeEventListener("mousedown", layerMouseDownListener);
        layer.removeEventListener("mouseup", layerMouseUpListener);
        layer.removeEventListener("mousemove", layerMouseListener);
        layer.parentNode.removeChild(getLayer());
        lastMousePosition = false;
    }

    // Gets the layer
    function getLayer() {
        return document.getElementById("extension-layer");
    }

    // Mouse button desambiguator
    function whichMouseButton(which) {
        var output = "left";
        if (which == 3) {
            output = "right";
        }
        if (which == 2) {
            output = "middle";
        }
        return output;
    }

    // Layer on mouse down
    function layerMouseDownListener(event) {
        var button = whichMouseButton(event.which);
        if (lastMousePosition) {
            moveTo(lastMousePosition.x, lastMousePosition.y);
        }
        if (button === "left") {
            fireWDown();
        } else {
            fireSpaceDown();
            event.preventDefault();
        }
    }

    // Layer on mouse up
    function layerMouseUpListener(event) {
        var button = whichMouseButton(event.which);
        if (button === "left") {
            fireWUp();
        } else {
            fireSpaceUp();
        }
        move(lastDirection);
    }

    // Layer on mousemove
    function layerMouseListener(event) {
        lastMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    // Disables W action
    function disableW() {
        window.addEventListener("keydown", replaceWDownListener, true);
        window.addEventListener("keyup", replaceWUpListener, true);
    }

    // Enables W action
    function enableW() {
        window.removeEventListener("keydown", replaceWDownListener, true);
        window.removeEventListener("keyup", replaceWUpListener, true);
    }

    // Listener that prevents W down
    function replaceWDownListener(event) {
        var key = event.keyCode || event.which;
        /* Moved to movement key listeners
        if (key === 87) {
            event.stopPropagation();
        }*/
        if (key === 81) {
            if (lastMousePosition) {
                moveTo(lastMousePosition.x, lastMousePosition.y);
            }
            fireWDown();
        }
    }

    // Listener that prevents W up
    function replaceWUpListener(event) {
        var key = event.keyCode || event.which;
        /* Moved to movement key listeners        
        if (key === 87) {
            event.stopPropagation();
        }*/
        if (key === 81) {
            fireWUp();
            move(lastDirection);
        }
    }

    // Fires the W keydown action
    function fireWDown() {
        triggerKeyEvent(87);
    }

    // Fires the W keyup action
    function fireWUp() {
        triggerKeyEvent(87, "keyup");
    }

    // Fires the W keydown action
    function fireSpaceDown() {
        triggerKeyEvent(32);
    }

    // Fires the W keyup action
    function fireSpaceUp() {
        triggerKeyEvent(32, "keyup");
    }

    // Disables space action
    function disableSpace() {
        window.addEventListener("keydown", replaceSpaceDownListener, true);
        window.addEventListener("keyup", replaceSpaceUpListener, true);
    }

    // Enables space action
    function enableSpace() {
        window.removeEventListener("keydown", replaceSpaceDownListener, true);
        window.removeEventListener("keyup", replaceSpaceUpListener, true);
    }

    // Listener that prevents space down
    function replaceSpaceDownListener(event) {
        var key = event.keyCode || event.which;
        if (key === 32) {
            event.stopPropagation();
        }
        if (key === 69) {
            if (lastMousePosition) {
                moveTo(lastMousePosition.x, lastMousePosition.y);
            }
            fireSpaceDown();
        }
    }

    // Listener that prevents space up
    function replaceSpaceUpListener(event) {
        var key = event.keyCode || event.which;
        if (key === 32) {
            event.stopPropagation();
        }
        if (key === 69) {
            fireSpaceUp();
            move(lastDirection);
        }
    }

    // Disables context menu
    function disableContextMenu() {
        window.addEventListener("contextmenu", disableContextMenuListener);
    }

    // Enables context menu
    function enableContextMenu() {
        window.removeEventListener("contextmenu", disableContextMenuListener);
    }

    // Disable context menu listener
    function disableContextMenuListener() {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    // Starts the extension
    function start() {
        addListeners();
        addLayer();
        disableW();
        disableSpace();
        disableContextMenu();
        addTriggerKeyFunction();
    }

    // Stops the extension
    function stop() {
        removeListeners();
        removeLayer();
        enableW();
        enableSpace();
        enableContextMenu();
        removeTriggerKeyFunction();
    }

    // Detects if the page is an agario client
    function detectAgario() {
        var output = true;
        // Conditions:
        if (
            // Has a canvas
            !document.querySelector("canvas") ||
            // Has #overlay
            !document.querySelector("#overlays") ||
            // Has #connecting
            !document.querySelector("#connecting")
        ) {
            output = false;
        }
        return output;
    }

    // Lol m8
    /*
    function easterEgg() {
        easterEggCount = 0;
        move("up");
        setTimeout(function() {
            move("right");
        }, 1000);
        setTimeout(function() {
            move("down");
        }, 2000);
        setTimeout(function() {
            move("left");
        }, 2500);
        setTimeout(function() {
            if (easterEggOn) {
                easterEgg();
            }
        }, 3000);
    }
    */

    // Start it baby!
    if (detectAgario()) {
        start();
    }
})(window);

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
