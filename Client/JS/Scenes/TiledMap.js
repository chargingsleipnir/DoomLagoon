class TiledMapScene extends SceneTransition {
    
    map;
    chestsByCoordInt;

    constructor(sceneName) {
        super(sceneName);
    }

    LoadMapData(jsonPath) {
        // MAP
        this.load.tilemapTiledJSON('tilemap', jsonPath);
    }

    create() {
        super.create();
        
        this.map = this.make.tilemap({ key: 'tilemap'});

        // Params: Tiled name (found in json), Phaser name
        var tileset_General = this.map.addTilesetImage('Toppers', 'tileset_General');
        var tileset_Grass = this.map.addTilesetImage('BaseGrass', 'tileset_Grass');
        var tileset_Trees = this.map.addTilesetImage('Forest', 'tileset_Trees');
        var tileset_Sand = this.map.addTilesetImage('BaseSand', 'tileset_Sand');
        var tileset_Dirt = this.map.addTilesetImage('BaseDirt', 'tileset_Dirt');
        var tileset_Water = this.map.addTilesetImage('BaseWater', 'tileset_Water');
        var tileset_MountainBrown = this.map.addTilesetImage('MountainsBrown', 'tileset_MountainBrown');
        var tileset_MountainGrey = this.map.addTilesetImage('MountainsGrey', 'tileset_MountainGrey');

        //var imageColl_Town01 = this.map.addTilesetImage('Topper Images', 'imageColl_Town01');
        //var imageColl_Castle02 = this.map.addTilesetImage('Topper Images', 'imageColl_Castle02');

        // Bottom Layer
        this.map.createStaticLayer('Terrain', [tileset_General, tileset_Grass, tileset_Sand, tileset_Dirt, tileset_Water], 0, 0);
        this.map.createStaticLayer('Transparent tiles', [tileset_General, tileset_Trees, tileset_MountainBrown, tileset_MountainGrey], 0, 0);
        var topLayer = this.map.createStaticLayer('InfrontOfCharacters', [tileset_General], 0, 0);
        topLayer.depth = Consts.depthExceptions.TILEMAP_OVERLAP_LAYER;
        
        // The only way to show object layer objects using Phaser, so keep them pretty unique wherever possible.
        //* The client is merely displaying these objects, it's the server that's handling interaction.
        this.chestsByCoordInt = {};
        
        this.map.createFromObjects('Objects', 11, { key: "volcano", frame: 0 });
        for(var i = 0; i < this.map.objects[0].objects.length; i++) {
            var obj = this.map.objects[0].objects[i];
            if(obj.type == Consts.tileTypes.SIGN) {
                this.map.createFromObjects('Objects', obj.id, { key: "sign", frame: 0 });
            }
            else if(obj.type == Consts.tileTypes.SPRING) {
                this.map.createFromObjects('Objects', obj.id, { key: "spring", frame: 0 });
            }
            // TODO: Check initial world data and set chests appropriately. (make it per player? So the chests aren't universally open/closed?)
            else if(obj.type == Consts.tileTypes.CHEST) {
                for(var j = 0; j < obj.properties.length; j++) {
                    if(obj.properties[j].name == "chestType") {
                        if(obj.properties[j].value == Consts.chestTypes.EQUIPMENT) {
                            this.AddChestObj(
                                this.map.createFromObjects('Objects', obj.id, { key: "chestBrownClosed", frame: 0 })[0],
                                "chestBrownClosed",
                                "chestBrownOpen"
                            );
                        }
                        else if(obj.properties[j].value == Consts.chestTypes.ABILITY) {
                            this.AddChestObj(
                                this.map.createFromObjects('Objects', obj.id, { key: "chestGreenClosed", frame: 0 })[0],
                                "chestGreenClosed",
                                "chestGreenOpen"
                            );
                        }
                    }
                }
            }
        }
        
        Network.CreateResponse("OpenChest", (intCoord) => {
            var coords = SuppFuncs.IntToCoords(intCoord, this.map.width);
            console.log(`Openning chest at ${intCoord}`, coords);
            this.chestsByCoordInt[intCoord].sprite.setTexture(this.chestsByCoordInt[intCoord].textureOpen, 0);
        });
        Network.CreateResponse("CloseChest", (intCoord) => {
            var coords = SuppFuncs.IntToCoords(intCoord, this.map.width);
            console.log(`Closing chest at ${intCoord}`, coords);
            this.chestsByCoordInt[intCoord].sprite.setTexture(this.chestsByCoordInt[intCoord].textureClosed, 0);
        });

        //Foreground Layer
        //var dynamicLayer = this.map.createDynamicLayer('Tile Layer 1', tileset, 0, 0);
    
        // Keeps the camera from scrolling once we've reached the edges of the map
        // Tile width and height used to account for 1 tile of dead space surrounding the entire map, hence subtracting 2 units off the ends
        this.cameras.main.setBounds(0, 0, this.map.tileWidth * this.map.width, this.map.tileHeight * this.map.height );
    
        /*
        this.map.setCollision(1);

        function testCallback() {
            console.log('Colliding with the ground.');
        }

        this.map.setTileIndexCallback(1, testCallback, this);
        */
    }

    AddChestObj(chest, textureClosed, textureOpen) {
        //* Object locations seem to be placed by their centre-points here, rather than their bottom-left corner as is the case when reading the raw data.
        var moddedX = chest.x - (chest.width * 0.5);
        var moddedY = chest.y - (chest.height * 0.5);
        var intCoord = SuppFuncs.CoordsToInt(moddedX / this.map.tileWidth, moddedY / this.map.tileHeight, this.map.width);
        this.chestsByCoordInt[intCoord] = {
            sprite: chest,
            textureClosed: textureClosed,
            textureOpen: textureOpen
        };
        console.log(this.chestsByCoordInt);
    }

    get MapTileWidth() {
        return this.map.tileWidth;// * this.cameras.main.zoom;
    }

    get MapTileHeight() {
        return this.map.tileHeight;// * this.cameras.main.zoom;
    }

    get MapTileWidth_Zoomed() {
        return this.map.tileWidth * this.cameras.main.zoom;
    }

    get MapTileHeight_Zoomed() {
        return this.map.tileHeight * this.cameras.main.zoom;
    }
}