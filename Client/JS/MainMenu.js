var MainMenu = (() => {
    
    var dispName;

    var elem_Container;

    var btn_StartGame;

    return {
        Init: () => {
            elem_Container = document.getElementById("MainMenu");

            document.getElementById('DispNameField').addEventListener("keyup", (e) => {
                dispName = e.currentTarget.value;
                // Cannot play without at least one character name
                if (e.currentTarget.value == '') {
                    btn_StartGame.disabled = true;
                    btn_StartGame.parentElement.classList.add("disabled");
                }
                else {
                    btn_StartGame.disabled = false;
                    btn_StartGame.parentElement.classList.remove("disabled");
                }
            });

            btn_StartGame = document.getElementById('StartBtn');
            btn_StartGame.addEventListener("click", (e) => {
                // Check local storage, database info, etc. to pass to play state
                Network.CreateResponse("RecWorldInitData", function (data) {

                    // Hide main menu & launch canvas/phaser game
                    Utility.html.ElemHideRear(elem_Container);
                    Utility.html.ElemShowMiddle(document.getElementById("FullGameContainer"));
                    Main.game = new Phaser.Game(Main.phaserConfig);
                    // TODO: Still a phaser 2 thing? Not even sure what it is, check it out.
                    //game.time.advancedTiming = true;

                    // Will start this automatically -> scene.start("Title");
                    // TODO: transfer data forward as in old phaser
                    //game.state.start('play', true, false, data);
                });
                Network.Emit("ReqWorldInitData");
            });

            document.getElementById('MainMenuOptionsBtn').addEventListener("click", OptionsMenu.Open);

            

            // TODO: This was old and left commented, not sure if it's still required, especially here. Perhaps in "init" of "Overworld"?
            //* Just always sending click coordinates to the server
            // Send canvas click position to the server
            // function GetPosition(event) {
            //     var posParent = ElemPosition(event.currentTarget);
            //     var posX = event.clientX - posParent.x;
            //     var posY = event.clientY - posParent.y;
            //     socket.emit("CanvasClick", { x: posX, y: posY });
            // }

            // function ElemPosition(elem) {
            //     var posX = 0;
            //     var posY = 0;
            
            //     while (elem) {
            //         if (elem.tagName == "BODY") {
            //             // deal with browser quirks with body/window/document and page scroll
            //             var xScrollPos = elem.scrollLeft || document.documentElement.scrollLeft;
            //             var yScrollPos = elem.scrollTop || document.documentElement.scrollTop;
                    
            //             posX += (elem.offsetLeft - xScrollPos + elem.clientLeft);
            //             posY += (elem.offsetTop - yScrollPos + elem.clientTop);
            //         }
            //         else {
            //             posX += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
            //             posY += (elem.offsetTop - elem.scrollTop + elem.clientTop);
            //         }
                
            //         elem = elem.offsetParent;
            //     }
            //     return {
            //         x: posX,
            //         y: posY
            //     };
            // }
            // game.canvas.addEventListener("click", GetPosition, false);
        },
        GetDispName: () => {
            return dispName || "I am Error";
        },
        Open: () => {
            Utility.html.ElemShowFront(elem_Container);
        }
    }
})();