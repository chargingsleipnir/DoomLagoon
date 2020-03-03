class Main {

    static game;

    static config = {
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
        scene: [Setup, MainMenu, OptionsMenu, Title, Overworld, Battle]
    }

    static get CanSaveLocal() {
        return (typeof (Storage) !== undefined);
    }

    static Init() {
        Main.game = new Phaser.Game(Main.config);
        // TODO: Still a phaser 2 thing? Not even sure what it is, check it out.
        //game.time.advancedTiming = true;
    }
}