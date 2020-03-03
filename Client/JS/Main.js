var Main = (() => {

    return {
        game: null,
        phaserConfig: {
            type: Phaser.AUTO,
            width: 960,
            height: 540,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 200 }
                }
            },
            parent: "CanvasContainer",
            scene: [Title, Overworld, Battle]
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