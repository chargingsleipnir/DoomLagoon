class TiledMapScene extends Phaser.Scene {
    
    map;

    constructor(sceneName) {
        super(sceneName);
    }

    LoadMapFiles(jsonPath, imagePath) {
        // MAP
        this.load.tilemapTiledJSON('tilemap', jsonPath);
        this.load.image('tileset', imagePath);
    }

    create() {
        this.map = this.make.tilemap({ key: 'tilemap'});

        // Params: Tiled name (found in json), Phaser name
        var tileset = this.map.addTilesetImage('tilesetPH', 'tileset');

         // TODO: Those string names "Tile Layer 1" are what I gave them when making them in Tiled, which have to match here.
        //Background Layer
        var staticLayer = this.map.createStaticLayer('Tile Layer 1', tileset, 0, 0);

        //Foreground Layer
        //var dynamicLayer = this.map.createDynamicLayer('Tile Layer 1', tileset, 0, 0);
    
        //this.world.setBounds(0, 0, this.map.tileWidth * this.map.width, this.map.tileHeight * this.map.height);
    
        /*
        this.map.setCollision(1);

        function testCallback() {
            console.log('Colliding with the ground.');
        }

        this.map.setTileIndexCallback(1, testCallback, this);
        */
    }

    get MapTileWidth() {
        return this.map.tileWidth
    }

    get MapTileHeight() {
        return this.map.tileHeight
    }
}