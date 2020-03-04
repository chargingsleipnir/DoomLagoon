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
        Init: () => {
            // Establish socket connection
            Network.InitSocketConnection(() => {
                // Phaser Game starts in MainMenu on Play button
                MainMenu.Init();
                OptionsMenu.Init();
            }); 
        }
    }
})();