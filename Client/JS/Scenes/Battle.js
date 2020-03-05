class Battle extends Phaser.Scene {
    
    constructor() {
        super("Battle");
    }

    create(data) {
        Main.activeScene = this;
    }
}