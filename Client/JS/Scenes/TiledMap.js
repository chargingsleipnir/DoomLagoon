class TiledMapScene extends Phaser.Scene {
    
    map;
    mapTileIndicies = {};
    mapTileNames = {};

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

        // Adding 1 to the index because Tiled does it on export, despite being different in the editor... not sure why exactly
        for(var index in tileset.tileProperties) {
            this.mapTileIndicies[tileset.tileProperties[index]["Name"]] = parseInt(index) + 1;
            this.mapTileNames[parseInt(index) + 1] = tileset.tileProperties[index]["Name"];
        }
        //console.log(tileset);
        //console.log(this.mapTileIndicies);

         // TODO: Those string names "Tile Layer 1" are what I gave them when making them in Tiled, which have to match here.
        //Background Layer
        var staticLayer = this.map.createStaticLayer('Tile Layer 1', tileset, 0, 0);

        //Foreground Layer
        //var dynamicLayer = this.map.createDynamicLayer('Tile Layer 1', tileset, 0, 0);
    
        // Keeps the camera from scrolling once we've reached the edges of the map
        // Tile width and height used to account for 1 tile of dead space surrounding the entire map, hence subtracting 2 units off the ends
        this.cameras.main.setBounds(
            this.map.tileWidth, 
            this.map.tileHeight, 
            this.map.tileWidth * (this.map.width - 2), 
            this.map.tileHeight * (this.map.height - 2)
        );
    
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