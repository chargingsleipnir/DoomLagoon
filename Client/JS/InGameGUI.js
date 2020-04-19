var InGameGUI = (() => {

    var elemFocusString;

    return {
        Init: (overworldScene) => {

            // =================================== Options menu button
            document.getElementById("InGameOptionsBtn").addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                e.currentTarget.blur();
                OptionsMenu.Open();
            });

            // =================================== Chat input
            var elem_ChatTextInput;
            function SendMsgToServer() {
                if(elem_ChatTextInput.value != "") {
                    Network.Emit("ReqChatLogUpdate", { name: MainMenu.GetDispName(), msg: elem_ChatTextInput.value });
                    elem_ChatTextInput.value = "";
                }
            }
            elem_ChatTextInput = document.getElementById("PlayerChatMsg");

            // Clicking the input field disables Phaser controls.
            elem_ChatTextInput.addEventListener('click', (event) => {
                elemFocusString = event.currentTarget.tagName;
                Main.game.input.keyboard.enabled = false;
            });
            // Enter key to send message
            elem_ChatTextInput.addEventListener('keyup', (event) => {
                if(event.keyCode === 13 && elemFocusString == "INPUT")
                    SendMsgToServer();
            });
            // Also "send message" button
            document.getElementById("PlayerChatSendMsgBtn").addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                e.currentTarget.blur();
                SendMsgToServer();
            });

            // =================================== Chat message window
            var elem_ChatLog = document.getElementById("ChatLog");
            var elem_NewChatNotif = document.getElementById("ChatNotifDot");

            function ToggleOpenChatView() {
                elem_ChatLog.classList.toggle('hide');
                elem_NewChatNotif.classList.add("hide");
            }
            // Space bar to open
            overworldScene.input.keyboard.on('keydown_SPACE', () => {
                if(elemFocusString != "INPUT")
                    ToggleOpenChatView();
            });
            // Also "view chat" button
            document.getElementById("PlayerChatViewBtn").addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                e.currentTarget.blur();
                ToggleOpenChatView();
            });
            Network.CreateResponse('RecChatLogUpdate', (data) => {
                var className = data.name == MainMenu.GetDispName() ? "chatLogNameSelf" : "chatLogName";
                var htmlString = `<li><span class="${className}">${data.name}:</span> ${data.msg}</li>`;
                var node = Utility.html.FromString(htmlString);
                elem_ChatLog.appendChild(node);
                elem_ChatLog.scrollTop = elem_ChatLog.scrollHeight;
                if(elem_ChatLog.classList.contains('hide')) {
                    elem_NewChatNotif.classList.remove("hide");
                }
            });
    
            // =================================== CLICK TO GET CELL VALUE
            Network.CreateResponse("RecCellValue", function (data) {
                if(isNaN(data.cellValue)) {
                    if(data.cellValue) {
                        var value = JSON.parse(JSON.stringify(data.cellValue));
                        console.log(`From server, data at cell x: ${data.gridX}, y: ${data.gridY} is: `, value);
                    }
                    else
                        console.warn(`Did not retrieve credible cell data from region clicked.`);
                }
                else
                    console.log(`From server, data at cell x: ${data.gridX}, y: ${data.gridY} is: ${data.cellValue}`);
            });
            // TODO: Expand beyond debug, as game is more fully implemented.
            Main.game.canvas.addEventListener("click", (event) => {
                //* NOTE: Not debug, very important!
                elemFocusString = event.currentTarget.tagName;
                elem_ChatTextInput.blur();

                Main.game.input.keyboard.enabled = true;

                var posParent = Utility.html.ElemPos(event.currentTarget);
                var posX = event.clientX - posParent.x;
                var posY = event.clientY - posParent.y;

                var worldX = (overworldScene.cameras.main.worldView.x * overworldScene.cameras.main.zoom) + posX,
                worldY = (overworldScene.cameras.main.worldView.y * overworldScene.cameras.main.zoom) + posY;

                var cellX = (worldX - (worldX % overworldScene.MapTileWidth_Zoomed)) / overworldScene.MapTileWidth_Zoomed,
                cellY = (worldY - (worldY % overworldScene.MapTileHeight_Zoomed)) / overworldScene.MapTileHeight_Zoomed;

                // console.log(`canvas click event, posParent - x: ${posParent.x}, y: ${posParent.y}`);
                // console.log(`canvas click event, event.client - x: ${event.clientX}, y: ${event.clientY}`);
                // console.log(`canvas click event, camera worldView - x: ${overworldScene.cameras.main.worldView.x * overworldScene.cameras.main.zoom}, y: ${overworldScene.cameras.main.worldView.y * overworldScene.cameras.main.zoom}`);
                // console.log(`canvas click event, mouse pos - x: ${posX}, y: ${posY}`);
                // console.log(`canvas click event, camera to world - x: ${worldX}, y: ${worldY}`);
                // console.log(`canvas click event, worldX % overworldScene.MapTile - x: ${worldX % overworldScene.MapTileWidth_Zoomed}, y: ${worldY % overworldScene.MapTileHeight_Zoomed}`);
                // console.log(`canvas click event, worldX - (worldX % overworldScene.MapTile) - x: ${worldX - (worldX % overworldScene.MapTileWidth_Zoomed)}, y: ${worldY - (worldY % overworldScene.MapTileHeight_Zoomed)}`);
                // console.log(`canvas click event, as cells - x: ${cellX}, y: ${cellY}`);

                Network.Emit("ReqCellValue", { x: cellX, y: cellY });
            }, false);
        },
        CheckCanvasFocus: () => {
            return elemFocusString != "INPUT";
        }
    }
})();