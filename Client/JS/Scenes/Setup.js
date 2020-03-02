class Setup extends Phaser.Scene {

    constructor() {
        super("Setup");
    }

    create () {
        Network.InitSocketConnection(() => {
            this.scene.start('MainMenu');
        }); // Establish socket connection
    }
}