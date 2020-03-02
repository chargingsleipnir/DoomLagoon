class Overworld extends Phaser.Scene {
    
    constructor() {
        super("Overworld");
    }

    preload() {
        // SPRITES
        this.load.image('navBoatLeft', 'Assets/Sprites/boatPH_Left.jpg');
        this.load.image('navBoatRight', 'Assets/Sprites/boatPH_Right.jpg');
        this.load.image('navBoatUp', 'Assets/Sprites/boatPH_Up.jpg');
        this.load.image('navBoatDown', 'Assets/Sprites/boatPH_Down.jpg');

        // MAP
        this.load.tilemap('tilemap', 'DataFiles/mapPH.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('tileset', 'Assets/Map/tilesetPH.png');
    }

    create() {
        this.add.text(20, 20, "Playing Game", {font: "25px Arial", fill: "yellow"});
    }
}