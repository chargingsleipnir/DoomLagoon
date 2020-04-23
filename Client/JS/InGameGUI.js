var InGameGUI = (() => {

    var elem_ChatTextInput;
    var chatInputFocused;
    var elem_ChatLog;

    function ChatInputFocus() {
        chatInputFocused = true;
        // No idea why the frame skip is necessary, but it is.
        // At 0 it worked for Chrome and IE, 1 rewuired for FF
        setTimeout(() => {
            elem_ChatTextInput.focus();
        }, 1);  
        Main.game.input.keyboard.enabled = false;
    }
    function ChatInputBlur() {
        chatInputFocused = false;
        elem_ChatTextInput.blur();
        Main.game.input.keyboard.enabled = true;
    }

    return {
        Init: (overworldScene) => {

            // =================================== Options menu button
            document.getElementById("InGameOptionsBtn").addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                e.currentTarget.blur();
                OptionsMenu.Open();
            });

            // =================================== Chat input
            function SendMsgToServer() {
                if(elem_ChatTextInput.value == "") {
                    console.log("Will not send blank message");
                    return;
                }

                Network.Emit("ReqChatLogUpdate", { name: MainMenu.GetDispName(), msg: elem_ChatTextInput.value });
                elem_ChatTextInput.value = "";
            }
            elem_ChatTextInput = document.getElementById("PlayerChatMsg");

            // Clicking the input field disables Phaser controls.
            elem_ChatTextInput.addEventListener('click', (event) => {
                ChatInputFocus();
            });
            // Enter key to send message
            elem_ChatTextInput.addEventListener('keyup', (event) => {
                if(event.keyCode === 13 && chatInputFocused)
                    SendMsgToServer();
            });
            // Also "send message" button
            document.getElementById("PlayerChatSendMsgBtn").addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                e.currentTarget.blur();
                SendMsgToServer();
            });

            // =================================== Chat message window
            elem_ChatLog = document.getElementById("ChatLog");

            // Enable portfolio site to get chat log
            window.onmessage = (event) => {
                //console.log(`Recieved message: (${event.data}) from origin: (${event.origin}).`);
                if(event.data == "ReqChatLog")
                    event.source.postMessage(elem_ChatLog.innerHTML, event.origin);
            };

            var elem_NewChatNotif = document.getElementById("ChatNotifDot");

            function ToggleOpenChatView() {
                elem_ChatLog.classList.toggle('hide');
                elem_NewChatNotif.classList.add("hide");
            }
            // Tab to switch focus
            //* This event only works for switching canvas to input, as the call shuts off Phaser's input system
            overworldScene.input.keyboard.on('keydown_TAB', ChatInputFocus);
            elem_ChatTextInput.addEventListener('keydown', (e) => {
                if(event.keyCode === 9) {
                    ChatInputBlur();
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            // Space bar to open
            overworldScene.input.keyboard.on('keydown_SPACE', () => {
                if(!chatInputFocused)
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
    
            var reqCellValueOut = false;
            // =================================== CLICK TO GET CELL VALUE
            Network.CreateResponse("RecCellValue", function (data) {
                reqCellValueOut = false;

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
                if(reqCellValueOut)
                    return;

                //* NOTE: Not debug, very important!
                ChatInputBlur();
                

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

                reqCellValueOut = true;
                Network.Emit("ReqCellValue", { x: cellX, y: cellY });
            }, false);
        },
        CheckCanvasFocus: () => {
            return !chatInputFocused;
        }
    }
})();