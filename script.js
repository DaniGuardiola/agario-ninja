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

    // Current state of keyNumbers
    var keyNumbers = [];

    // WASD keys tracking
    var wasdKeys = [];

    // Arrow keys tracking
    var arrowKeys = [];

    // Last direction
    var lastDirection = false;

    // Last mouse position
    var lastMousePosition = "stop";

    // True if mouse is enabled
    var mouseEnabled = false;

    // Adds a key to the keys array or
    // moves it down if already included
    function addKey(key, is) {
        removeKey(key, null, true);
        if (is === "wasd") {
            // Remove from WASD
            index = wasdKeys.indexOf(key);
            if (index < 0) {
                wasdKeys.push(key);
            }
        } else if (is === "arrow") {
            // Remove from WASD
            index = arrowKeys.indexOf(key);
            if (index < 0) {
                arrowKeys.push(key);
            }
        }
        console.log("ADD!");
        console.log("WASD: " + wasdKeys.join(", "));
        console.log("Arrows: " + arrowKeys.join(", "));
        var index = keys.indexOf(key);
        if (index > -1) {
            console.log("Keys (unaltered): " + keys.join(", "));
            return;
        }
        keys.push(key);
        console.log("Keys: " + keys.join(", "));
    }

    // Removes a key from the keys array
    function removeKey(key, is, force) {
        var index;
        if (is === "wasd") {
            // Remove from WASD
            index = wasdKeys.indexOf(key);
            if (index > -1) {
                wasdKeys.splice(index, 1);
            }
        } else if (is === "arrow") {
            // Remove from arrows
            index = arrowKeys.indexOf(key);
            if (index > -1) {
                arrowKeys.splice(index, 1);
            }
        }
        console.log("REMOVE!");
        console.log("WASD: " + wasdKeys.join(", "));
        console.log("Arrows: " + arrowKeys.join(", "));
        // If exists on WASD or arrows, stop
        if ((wasdKeys.indexOf(key) > -1 || arrowKeys.indexOf(key) > -1) && !force) {
            console.log("Keys (unaltered): " + keys.join(", "));
            return;
        }
        // Remove from keys
        index = keys.indexOf(key);
        if (index > -1) {
            keys.splice(index, 1);
        }
        console.log("Keys: " + keys.join(", "));
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

    // MoveTo wrapper for coordinate objects
    function moveToCoordinates(coordinates) {
        moveTo(coordinates.x, coordinates.y);
    }

    // Move the player based on direction
    function move(direction, force) {
        if ((direction === lastDirection || mouseEnabled) && !force) {
            return;
        }
        var co = coordinates(direction);
        if (direction === "stop") {
            moveStop(true);
            lastDirection = direction;
            return;
        } else {
            interruptMoveStop();
        }
        lastDirection = direction;
        moveTo(co.x, co.y);
    }

    // Define object for stop timeouts
    var stopTimeout = false;

    // True if it is stopping
    var stopping = false;

    // Last direction cached
    var stoppingDirection = false;

    // Current step on stopping movement
    var stoppingStep;

    // Interpolate two directions based on a step
    function interpolateDirections(one, two, step) {
        one = coordinates(one);
        two = coordinates(two);
        var output = {
            x: ((two.x - one.x) * step) + one.x,
            y: ((two.y - one.y) * step) + one.y
        };
        return output;
    }

    // Stops the blob
    function moveStop(startIt) {
        if (startIt) {
            stopping = true;
            stoppingStep = 0.5;
            stoppingDirection = lastDirection;
        }
        if (!stopping) {
            return;
        }
        if (stoppingStep <= 0) {
            interruptMoveStop();
            moveToCoordinates(coordinates("stop"));
            return;
        }
        moveToCoordinates(interpolateDirections(stoppingDirection, "stop", 1 - stoppingStep));
        stoppingStep = stoppingStep - 0.04;
        stopTimeout = setTimeout(moveStop, 1);
    }

    // Interrupts the stopping of the blob
    function interruptMoveStop() {
        clearTimeout(stopTimeout);
        stopping = false;
    }

    // Returns the name of a key based on its number
    function whichKey(number) {
        return ({
            // Arrows
            "37": "left",
            "38": "up",
            "39": "right",
            "40": "down",
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
        var index = keyNumbers.indexOf(key);
        if (index < 0) {
            keyNumbers.push(key);
        } else {
            return;
        }
        // Stopping W
        if (key === 87) {
            event.stopPropagation();
        }
        var is = key < 50 ? "wasd" : "arrow";
        key = whichKey(key);
        if (key === undefined) {
            return;
        }
        addKey(key, is);
        resolve();
    }

    // Key up event listener
    function keyUpListener(event) {
        var key = event.keyCode || event.which;
        var index = keyNumbers.indexOf(key);
        if (index > -1) {
            keyNumbers.splice(index, 1);
        }
        // Stopping W
        if (key === 87) {
            event.stopPropagation();
        }
        var is = key < 50 ? "wasd" : "arrow";
        key = whichKey(key);
        if (key === false) {
            return;
        }
        removeKey(key, is);
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

    // Adds a switch to enable / disable the extension
    function addSwitch() {
        if (getSwitch()) {
            return;
        }
        var switchEl = document.createElement("div");
        switchEl.id = "extension-switch";
        switchEl.setAttribute("value", "on");
        switchEl.classList.add("material-switch");
        switchEl.addEventListener("click", switchClickListener);
        document.body.insertBefore(switchEl, document.body.children[0]);
    }

    // Gets the switch
    function getSwitch() {
        return document.getElementById("extension-switch");
    }

    // Switch on click
    function switchClickListener() {
        var switchEl = getSwitch();
        if (switchEl.getAttribute("value") === "on") {
            switchEl.setAttribute("value", "off");
            stop();
        } else {
            switchEl.setAttribute("value", "on");
            start();
        }
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
            fireSpaceDown();
        } else {
            fireWDown();
            event.preventDefault();
        }
    }

    // Layer on mouse up
    function layerMouseUpListener(event) {
        var button = whichMouseButton(event.which);
        if (button === "left") {
            fireSpaceUp();
        } else {
            fireWUp();
        }
        move(lastDirection, true);
    }

    // Layer on mousemove
    function layerMouseListener(event) {
        lastMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
        if (mouseEnabled) {
            moveTo(lastMousePosition.x, lastMousePosition.y);
        }
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
        if (key === 80) {
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
        if (key === 80) {
            fireWUp();
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
            mouseEnabled = mouseEnabled ? false : true;
            event.stopPropagation();
        }
        if (key === 79) {
            fireSpaceDown();
        }
    }

    // Listener that prevents space up
    function replaceSpaceUpListener(event) {
        var key = event.keyCode || event.which;
        if (key === 32) {
            event.stopPropagation();
        }
        if (key === 79) {
            fireSpaceUp();
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
        move("stop");
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

    // Debug mode
    function debug() {
        getCanvas().addEventListener("mousemove", function(event) {
            var element = document.createElement("div");
            element.style.position = "fixed";
            element.style.width = element.style.height = "20px";
            element.style.borderRadius = "50%";
            element.style.backgroundColor = "red";
            element.style.top = (event.clientY - 10) + "px";
            element.style.left = (event.clientX - 10) + "px";
            document.body.appendChild(element);
            setTimeout(function() {
                document.body.removeChild(element);
            }, 400);
        });
    }

    // Start debug mode (toggle comment to enable / disable)
    // debug();

    // Start it baby!
    if (detectAgario()) {
        addSwitch();
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
    var style = '#extension-layer { position: fixed; width: 100%; height: 100%; z-index: 1; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABEVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///9o4Z9eAAAAWXRSTlMAAxVIlt7mr1IYBQk/sfj6/vvPVBABFGrx/e/yihvksm88nI1lxFAEg8E6uDAnqfcGDqL8zivudHn5zFW09pjYZz6GItKrHbsq5XhZ6AvROce/Sgpo8JcCDDLDbjEAAAABYktHRFoDu6WiAAABYklEQVQoz3WSC1OCQBSFr5SQobKbLxbIV6ZokiWKopJlWWllpWXd//9HWqQpc/LMzuzs+XbP3ReAr5CwsxtGLlHai+zDj+RoLK4QHxAaP0gkU4GdSmdUhlQTdV3UKBLVOAxI2uB2NpcvFIuFfC5LkR2tiFzSUTkuVwBME6BSrsaRGUletyaiclL3l/oAwDptoJo4g/Omja2V/w3AqtrkIAJtB50OrAMoZ7GxB10Xe0Jg9PtBX8lRKsHA9i5gQ3mNiDAkzuUmuBIRQUFPMk1zxGOur3nciA+KOgfqNnCzLWpM/y0ehk4cW7cb272zlV24n6A2/XvAh0f0duDJsMnseR3UXxiLCZCyZkhfn39B/URBNRriiXN+7bPpbQCETstFlpH9KYs3Hdl7a1mSpNKypzHUjXRQbDGfMSSe4/FGkIml9PejQ8gyJi7lv4HYrtOsyb8n+ljcd8Y3qjIcdNufoZX1BZNnPVts0zcsAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE0LTAyLTAyVDE3OjEzOjE4KzA4OjAwJfgKpgAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNC0wMi0wMlQxNzoxMzoxOCswODowMFSlshoAAAAASUVORK5CYII=) -12 -12, crosshair; } #extension-switch { position: fixed; top: 16px; left: 16px; z-index: 500; } .material-switch { height: 48px; width: 48px; display: block; background-position: center; background-size: 100% auto; background-repeat: no-repeat; cursor: pointer; position: relative; } .material-switch[value~=on]:after { left: 22px; background-color: #009688; width: 19px; height: 19px; top: 14px; } .material-switch[value~=on]:before { background-color: #6DBDB6; } .material-switch:before { content: ""; width: 32px; border-radius: 50px; height: 13px; position: absolute; top: 17px; left: 8px; -webkit-transition: background-color 0.25s; -moz-transition: background-color 0.25s; -o-transition: background-color 0.25s; transition: background-color 0.25s; will-change: background-color; } .material-switch:after { content: ""; border-radius: 50%; position: absolute; -webkit-transition: left 0.25s, top 0.25s, height 0.25s, width 0.25s, background-color 0.25s; -moz-transition: left 0.25s, top 0.25s, height 0.25s, width 0.25s, background-color 0.25s; -o-transition: left 0.25s, top 0.25s, height 0.25s, width 0.25s, background-color 0.25s; transition: left 0.25s, top 0.25s, height 0.25s, width 0.25s, background-color 0.25s; will-change: left, top, height, width, background-color; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24); } .material-switch:not([value=on]):after { left: 6px; background-color: #fff; width: 21px; height: 21px; top: 13px; } .material-switch:not([value=on]):before { background-color: #929292; }';
    var s = document.createElement("style");
    s.innerHTML = style;
    document.getElementsByTagName("head")[0].appendChild(s);
})();
