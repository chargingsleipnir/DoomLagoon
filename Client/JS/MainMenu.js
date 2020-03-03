var MainMenu = (() => {
    
    var dispName;

    var elem_Container;

    var input_Username;
    var input_Password; 

    var btn_Options;
    var btn_StartGame;

    return {
        Init: () => {
            input_Username = document.getElementById("Username"),
            input_Password = document.getElementById("Password");

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
                Network.CreateResponse("WorldInitData", function (data) {

                    Main.game = new Phaser.Game(Main.phaserConfig);
                    // TODO: Still a phaser 2 thing? Not even sure what it is, check it out.
                    //game.time.advancedTiming = true;

                    // Will start this automatically -> scene.start("Title");
                    // TODO: transfer data forward as in old phaser
                    //game.state.start('play', true, false, data);
                });
                Network.Emit("RequestWorldData");
            });

            btn_Options = document.getElementById('OptionsBtn');
            btn_Options.addEventListener("click", (e) => {
                OptionsMenu.Open();
                Utility.html.ElemHideRear(elem_Container);
            });

            Network.CreateResponse("SignInResponse", (success) => { });
            Network.CreateResponse("SignUpResponse", (success) => { });
            Network.CreateResponse("RemoveAccountResponse", (success) => { });

            document.getElementById('SignInBtn').addEventListener('click', (e) => {
                Network.Emit("SignIn", {
                    username: input_Username.value,
                    password: input_Password.value
                });
            });
            document.getElementById('SignUpBtn').addEventListener('click', (e) => {
                Network.Emit("SignUp", {
                    username: input_Username.value,
                    password: input_Password.value
                });
            });
            document.getElementById('RemoveAccountBtn').addEventListener('click', (e) => {
                Network.Emit("RemoveAccount", {
                    username: input_Username.value,
                    password: input_Password.value
                });
            });

            // TODO: This was old and left commented, not sure if it's still required, especially here. Perhaps in "init" of "Overworld"?
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