var Main = (() => {

    var scenes = [Title, Overworld, Battle];
    var gameMsgBox;
    var msgQueue = [];
    var timeoutHdlr;
    var seconds;
            
    function ResetDispMessage() {
        if(!gameMsgBox.classList.contains("fadeIn"))
            return;

        gameMsgBox.innerHTML = msgQueue[0].msg;
        seconds = msgQueue[0].seconds;
        msgQueue.shift();

        clearTimeout(timeoutHdlr);
        timeoutHdlr = setTimeout(() => {
            if(msgQueue.length > 0) {
                ResetDispMessage();
            }
            else {
                gameMsgBox.classList.remove("fadeIn");
            }
        }, seconds * 1000);
    }

    return {
        game: null,
        player: null,
        animData: null,
        phaserConfig: {
            title: "Doom Lagoon",
            type: Phaser.AUTO,
            width: 960,
            height: 560,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 200 }
                }
            },
            parent: "CanvasContainer",
            callbacks: { postBoot: (game) => {
                console.log("Post Boot callback, game:", game);

                Main.game = game;

                // TODO: Still a phaser 2 thing? Not even sure what it is, check it out.
                //game.time.advancedTiming = true;

                for (let scene of scenes) {
                    game.scene.add(scene.name, scene);
                }

                game.scene.start('Title');
            }}
        },
        userPrefs: {
            useLocalStorage: false,
            useDBStorage: false,
            volumePct: 50
        },
        Init: () => {
            // Establish socket connection
            Network.InitSocketConnection(() => {
                // Phaser Game starts in MainMenu on Play button
                MainMenu.Init();
                OptionsMenu.Init();

                Network.CreateResponse("RecSave", (success) => {
                    if(success) {
                        Main.DispMessage("Game saved to database.", 2);
                    }
                });

                gameMsgBox = document.getElementById("GameMessageBox");
                gameMsgBox.addEventListener("webkitTransitionEnd", ResetDispMessage);
                gameMsgBox.addEventListener("transitionend", ResetDispMessage);
            });
        },
        // TODO: Call/implement these
        StartAutoSaveTimer: () => {
            // Attempt to save every 30 seconds
            setInterval(Main.Save, 20000);
        },
        Save: () => {
            if(!Main.player)
                return;

            if(Main.userPrefs.useLocalStorage) {
                localStorage.setItem(Network.LOCAL_STORAGE_KEY, JSON.stringify(Main.player.GetSavePack()));
                Main.DispMessage("Game saved locally.", 2);
            }
    
            if(Main.userPrefs.useDBStorage) {
                Network.Emit("ReqSave", Main.player.GetSavePack());
            }
        },
        DispMessage: (msg, seconds) => {
            if(msgQueue.length == 0) {
                gameMsgBox.innerHTML = msg;
            }

            msgQueue.push({
                msg: msg,
                seconds: seconds
            });
            
            gameMsgBox.classList.add("fadeIn");
        }
    }
})();