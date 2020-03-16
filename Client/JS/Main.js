var Main = (() => {

    var scenes = [Title, Overworld, Battle];

    return {
        game: null,
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
            }); 
        },
        StartAutoSaveTimer: () => {
            // Attempt to save every 30 seconds
            setInterval(Main.Save, 30000);
        },
        Save: (saveData) => {
            if(Main.userPrefs.useLocalStorage) {
                localStorage.setItem(Network.LOCAL_STORAGE_KEY, JSON.stringify(saveData));
            }
    
            if(Main.userPrefs.useDBStorage) {
                // TODO: Network call
            }
        }
    }
})();