class Overworld extends Phaser.Scene {
    
    player;

    constructor() {
        super("Overworld");
    }

    preload() {
        LocalPlayer.LoadImages(this);

        // MAP
        this.load.tilemapTiledJSON('tilemap', 'DataFiles/mapPH.json');
        this.load.image('tileset', '../../Assets/Map/tilesetPH.png');
    }

    create(data) {
        Main.activeScene = this;

        var map = this.make.tilemap({ key: 'tilemap' });

        // Params: Tiled name (found in json), Phaser name
        var tileset = map.addTilesetImage('tilesetPH', 'tileset');

        // TODO: Those string names "Tile Layer 1" are what I gave them when making them in Tiled, which have to match here.
        //Background Layer
        var staticLayer = map.createStaticLayer('Tile Layer 1', tileset, 0, 0);

        //Foreground Layer
        //var dynamicLayer = map.createDynamicLayer('Tile Layer 1', tileset, 0, 0);
    
        // TODO: Get the amount of tiles dynamically for this, instead of just putting 100.
        //this.world.setBounds(0, 0, Constants.TILE_SIZE * 100, Constants.TILE_SIZE * 100);
 
        /*
        map.setCollision(1);

        function testCallback() {
            console.log('Colliding with the ground.');
        }

        map.setTileIndexCallback(1, testCallback, this);
        */

        this.player = new LocalPlayer(this, data.gridSpawn);
    }
}