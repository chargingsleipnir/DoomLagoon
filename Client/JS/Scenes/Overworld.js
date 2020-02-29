class Overworld extends Phaser.Scene {
    
    constructor() {
        super("Overworld");
    }

    create() {
        this.add.text(20, 20, "Playing Game", {font: "25px Arial", fill: "yellow"});
    }
}