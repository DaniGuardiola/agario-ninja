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

    // Start and end observers
    var observerStart, observerEnd;

    // Game start and end timestamp
    var gameTimestamp = false;

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
        var index = keys.indexOf(key);
        if (index > -1) {
            return;
        }
        keys.push(key);
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
        // If exists on WASD or arrows, stop
        if ((wasdKeys.indexOf(key) > -1 || arrowKeys.indexOf(key) > -1) && !force) {
            return;
        }
        // Remove from keys
        index = keys.indexOf(key);
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

    // Toggle checkbox
    function toggleCheckbox(what) {
        var checkbox = document.querySelector("[data-itr=\"" + what + "\"").previousElementSibling;
        checkbox.checked = checkbox.checked ? false : true;
        var ev = new Event("change");
        checkbox.dispatchEvent(ev);
    }

    // Checkbox change listener add
    function addCheckboxChange() {
        var checkboxes = document.querySelectorAll("#options input[type=\"checkbox\"");
        for (var i = checkboxes.length - 1; i >= 0; i--) {
            checkboxChange(checkboxes[i]);
            checkboxes[i].addEventListener("change", checkboxChange);
        }
    }

    // Checkbox change listener add
    function removeCheckboxChange() {
        var checkboxes = document.querySelectorAll("#options input[type=\"checkbox\"");
        for (var i = checkboxes.length - 1; i >= 0; i--) {
            checkboxes[i].removeEventListener("change", checkboxChange);
        }
    }

    // Checkbox change listener
    function checkboxChange(event) {
        var checkbox, id;
        // Check if event parameter is element
        if (event.nodeType) {
            checkbox = event;
        } else {
            checkbox = event.currentTarget;
        }
        id = checkbox.nextElementSibling.getAttribute("data-itr");

        if (id === "option_dark_theme") {
            if (checkbox.checked) {
                document.body.classList.add("dark");
            } else {
                document.body.classList.remove("dark");
            }
        }
    }

    // Option router
    function routeOption(key) {
        if (key === 67) { // C
            toggleCheckbox("option_no_skins");
        } else if (key === 86) { // V
            toggleCheckbox("option_no_colors");
        } else if (key === 66) { // B
            toggleCheckbox("option_dark_theme");
        } else if (key === 77) { // M
            toggleCheckbox("option_show_mass");
        } else if (key === 78) { // N
            toggleCheckbox("option_no_names");
        } else {
            return false;
        }
        return true;
    }

    // Key down event listener
    function keyDownListener(event) {
        var key = event.keyCode || event.which;
        if (event.target.tagName && event.target.tagName.toLowerCase() !== "input") {
            if (routeOption(key)) {
                return;
            }
        }
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
                    direction = "up";
                }
                break;
            case "right":
                if (second === "up") {
                    direction = "up-right";
                } else if (second === "down") {
                    direction = "down-right";
                } else {
                    direction = "right";
                }
                break;
            case "down":
                if (second === "right") {
                    direction = "down-right";
                } else if (second === "left") {
                    direction = "down-left";
                } else {
                    direction = "down";
                }
                break;
            case "left":
                if (second === "down") {
                    direction = "down-left";
                } else if (second === "up") {
                    direction = "up-left";
                } else {
                    direction = "left";
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

    // Adds the font
    function addFont() {
        var promise = new Promise(function(resolve, reject) {
            // do a thing, possibly async, then…
            var url = "https://fonts.googleapis.com/css?family=Candal";
            var link = document.createElement("link");
            link.setAttribute("rel", "stylesheet");
            link.href = url;
            document.head.appendChild(link);
            link.addEventListener("load", resolve);
        });

        return promise;
    }

    // Add logo
    function addLogo() {
        var logo = document.createElement("span");

        // TWITTER
        var twitterLink = document.createElement("a");
        twitterLink.href = "https://twitter.com/home?status=I'm%20playing%20Agar.io%20with%20my%20keyboard!%0A%0AWASD%20controls,%20improved%20mouse%20aiming%20precision%20and%20more%0A%0ATry%20Agar.io%20Ninja!%0A%0Ahttps%3A//goo.gl/G67qqE";
        twitterLink.setAttribute("target", "_blank");
        var twitterImage = document.createElement("img");
        twitterImage.src = "http://vignette1.wikia.nocookie.net/una-corte-de-rosas-y-espinas/images/1/1a/Twitter_logo.png/revision/latest?path-prefix=es";
        twitterImage.style.height = "32px";
        twitterImage.style.marginLeft = "16px";
        twitterLink.appendChild(twitterImage);

        // FACEBOOK
        var facebookLink = document.createElement("a");
        facebookLink.href = "https://www.facebook.com/sharer/sharer.php?u=https%3A//goo.gl/G67qqE";
        facebookLink.setAttribute("target", "_blank");
        var facebookImage = document.createElement("img");
        facebookImage.src = "https://upload.wikimedia.org/wikipedia/commons/c/cd/Facebook_logo_(square).png";
        facebookImage.style.height = "32px";
        facebookImage.style.marginLeft = "16px";
        facebookLink.appendChild(facebookImage);

        logo.id = "ninja-logo";
        logo.textContent = "Agar.io Ninja";
        logo.appendChild(twitterLink);
        logo.appendChild(facebookLink);
        document.body.appendChild(logo);
        addPromo();
    }

    // Add promo
    function addPromo() {
        var promo = document.createElement("span");
        promo.id = "ninja-promo";
        promo.addEventListener("click", promoClick);

        // CLOSE
        var close = document.createElement("span");
        close.textContent = "x";
        close.classList.add("close");
        close.addEventListener("click", closePromoClick);

        promo.textContent = "Try Slither.io Ninja now!";
        promo.appendChild(close);
        document.body.appendChild(promo);
    }

    function closePromoClick(e) {
        var promo = document.querySelector("#ninja-promo");
        promo.parentNode.removeChild(promo);
        e.stopPropagation();
    }

    function promoClick() {
        var url = "https://chrome.google.com/webstore/detail/eolomglgggfcbbcmfohojmakeolmbbjn";
        window.open(url, '_blank');
    }

    // Adds a switch to enable / disable the extension
    function addSwitch() {
        if (getSwitch()) {
            return;
        }
        chrome.storage.local.get("on", function(storage) {
            var on = storage.on;
            var switchEl = document.createElement("div");
            switchEl.id = "extension-switch";
            switchEl.classList.add("material-switch");
            switchEl.addEventListener("click", switchClickListener);
            document.body.insertBefore(switchEl, document.body.children[0]);
            if (on === "true") {
                switchEl.setAttribute("value", "on");
                start();
            }
        });
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
            chrome.storage.local.set({
                "on": "false"
            });
            stop();
        } else {
            switchEl.setAttribute("value", "on");
            start();
            chrome.storage.local.set({
                "on": "true"
            });
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

    // Show help
    function showHelp() {
        var promise = new Promise(function(resolve, reject) {
            var element = document.createElement("span");
            element.innerText = "<---- Use this button to activate / deactivate keyboard controls";
            element.id = "ninja-help";
            document.body.appendChild(element);
            setTimeout(function() {
                element.parentNode.removeChild(element);
                resolve();
            }, 10000);
        });

        return promise;
    }

    // Observe play start
    function setupObservers() {
        // select the target node
        var target = document.querySelector('#overlays');

        // create an observer instance
        observerStart = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === "style" && mutation.target.style.display === "none") {
                    gameStart();
                } else if (mutation.attributeName === "style" && mutation.target.style.display === "block") {
                    gameEnd();
                }
            });
        });

        // configuration of the observer:
        var config = { attributes: true };

        // pass in the target node, as well as the observer options
        observerStart.observe(target, config);
    }

    // Remove observers
    function removeObservers() {
        gameEnd();
        observerStart.disconnect();
        observerEnd.disconnect();
    }

    function gameStart() {
        if (!gameTimestamp) {
            gameTimestamp = Math.floor(Date.now() / 1000);
        }
    }

    function gameEnd() {
        if (gameTimestamp) {
            var seconds = Math.floor(Date.now() / 1000) - gameTimestamp;
            var minutes = seconds / 60;
            gameTimestamp = false;
            chrome.storage.local.get("minutesPlay", function(storage) {
                var minutesPlay = storage.minutesPlay;
                if (!minutesPlay) {
                    minutesPlay = 0;
                }
                minutesPlay = minutesPlay + minutes;
                chrome.storage.local.set({
                    "minutesPlay": minutesPlay
                });
                //console.log("!!!!!!!!!!!!!!!!!!!!!!!");
                //console.log("PLAYED FOR " + minutesPlay);
                //console.log("!!!!!!!!!!!!!!!!!!!!!!!");
            });
        }
    }

    // Starts the extension
    function start() {
        addListeners();
        addCheckboxChange();
        addLayer();
        disableW();
        disableSpace();
        disableContextMenu();
        addTriggerKeyFunction();
        move("stop");
        setupObservers();
    }

    // Stops the extension
    function stop() {
        removeListeners();
        removeCheckboxChange();
        removeLayer();
        enableW();
        enableSpace();
        enableContextMenu();
        removeTriggerKeyFunction();
        removeObservers();
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
        addFont().then(showHelp).then(addLogo);
    }
})(window);


// Hi googler, please don't remove my extension again
// I really don't know what's the problem at this point

// Why can't we be friends [4x]

// I seen ya, I seen ya, I seen ya 'round for a long long time
// I really, I really, I really remember when you drank my wine

// Why can't we be friends [4x]

// I seen ya, I seen ya, I seen ya walkin' down in Chinatown
// I called ya, I called ya, I called but you did not look around
// I pay my, I pay my, I pay my money to the welfare line
// I seen ya, I seen ya, I seen ya standing in it everytime

// Why can't we be friends [4x]

// The color, the color, the color of your skin don't matter to me
// As long as, as long as, long as we can live in harmony
// I kinda, I kinda, I kinda, like to be the president
// And I could, and I could, and I could show you how your money's spent

// Why can't we be friends [4x]

// Sometimes I don't speak right
// But did I know what I was talking about
// I know you're working for the CIA 
// They wouldn't have you in the mafia 

// Why can't we be friends [4x]
// [Repeat to fade]

// <3
