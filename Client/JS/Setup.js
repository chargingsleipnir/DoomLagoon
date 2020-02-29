
var setupState = (function () {
    
    return {
        create: function () {

            Network.InitSocketConnection(this.SetupComplete); // Establish socket connection
            game.time.advancedTiming = true;

            /*
            // Game play
        
            game.canvas.addEventListener("click", GetPosition, false);
            function GetPosition(event) {
                var posParent = ElemPosition(event.currentTarget);
                var posX = event.clientX - posParent.x;
                var posY = event.clientY - posParent.y;
                socket.emit("CanvasClick", { x: posX, y: posY });
            }

            function ElemPosition(elem) {
                var posX = 0;
                var posY = 0;
            
                while (elem) {
                    if (elem.tagName == "BODY") {
                        // deal with browser quirks with body/window/document and page scroll
                        var xScrollPos = elem.scrollLeft || document.documentElement.scrollLeft;
                        var yScrollPos = elem.scrollTop || document.documentElement.scrollTop;
                    
                        posX += (elem.offsetLeft - xScrollPos + elem.clientLeft);
                        posY += (elem.offsetTop - yScrollPos + elem.clientTop);
                    }
                    else {
                        posX += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
                        posY += (elem.offsetTop - elem.scrollTop + elem.clientTop);
                    }
                
                    elem = elem.offsetParent;
                }
                return {
                    x: posX,
                    y: posY
                };
            }
        
        
            // Misc        
            var colourMap = { "red": "#FF0000", "green": "#00FF00", "blue": "#0000FF", "black": "#000000" };
            function ColourChange(colour) {
            
                if (typeof (Storage) !== "undefined") {
                    localStorage.setItem("colour", colour);
                }
            
                socket.emit("ColourSelect", { colour: colourMap[colour] });
            }
        
            if (typeof (Storage) !== "undefined") {
                if (localStorage.getItem("colour")) {
                    socket.emit("ColourSelect", { colour: colourMap[localStorage.getItem("colour")] });
                
                    var selectElem = document.getElementById("colourSelection");
                    selectElem.value = localStorage.getItem("colour");
                }
            }
            */            
        },
        SetupComplete: function () {
            game.state.start('menu');
        }
    }
})();

var canSaveLocal = (typeof (Storage) !== undefined);
var doSaveLocally = false;
function DoSaveLocally(checkbox) {
    doSaveLocally = checkbox.checked;
}