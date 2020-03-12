class Overworld extends TiledMapScene {
    
    player;

    sprites = {};

    // Shared among all boats of course
    boatImgKeysArr = [
        'navBoatLeft',
        'navBoatRight',
        'navBoatUp',
        'navBoatDown'
    ];

    constructor() {
        super("Overworld");

        this.sprites[Consts.spriteTypes.PLAYER] = {}
        this.sprites[Consts.spriteTypes.ENEMY] = {}
        this.sprites[Consts.spriteTypes.NPC] = {}
    }

    preload() {
        this.load.image(this.boatImgKeysArr[Consts.dirImg.LEFT], '../../Assets/Sprites/boatPH_Left.jpg');
        this.load.image(this.boatImgKeysArr[Consts.dirImg.RIGHT], '../../Assets/Sprites/boatPH_Right.jpg');
        this.load.image(this.boatImgKeysArr[Consts.dirImg.UP], '../../Assets/Sprites/boatPH_Up.jpg');
        this.load.image(this.boatImgKeysArr[Consts.dirImg.DOWN], '../../Assets/Sprites/boatPH_Down.jpg');

        this.LoadMapFiles('DataFiles/mapPH.json', '../../Assets/Map/tilesetPH.png');
    }

    create(data) {
        super.create();

        this.player = new LocalPlayer(this, data.gridSpawn, this.boatImgKeysArr);
        this.cameras.main.startFollow(this.player.gameObjCont);

        //------------------------ SETUP NETWORK CALLS

        var self = this;
        // First emission sent from server - assign proper id, setup map, etc.
        Network.CreateResponse("GetServerGameData", function (data) {
            for (let i = 0; i < data.sprites.length; i++) {
                // TODO: Include direction
                self.sprites[data.sprites[i].type][data.sprites[i].id] = new NetSprite(
                    self, 
                    data.sprites[i].gridPos, 
                    self.boatImgKeysArr, 
                    data.sprites[i].dir,  
                    data.sprites[i].name, 
                    data.sprites[i].id, 
                    data.sprites[i].type == Consts.spriteTypes.PLAYER
                );
            }
        });

        // and tell everyone else about player. Adding new players after this player has joined
        // TODO: boatImgKeysArr only used for now until player have different visuals
        Network.CreateResponse("AddNewPlayer", function (playerData) {
            self.sprites[Consts.spriteTypes.PLAYER][playerData.id] = new NetSprite(
                self, 
                playerData.gridPos, 
                self.boatImgKeysArr, 
                playerData.dir,  
                playerData.name, 
                playerData.id, 
                true
            );
        });

        // CHECK STORAGE INFO, databse info, etc. Send everything necessary to server to pass to others
        Network.Emit("Play", {
            initPack: {
                id: Network.GetSocketID(),
                name: this.player.name,
                gridPos: this.player.moveCache_Grid[Consts.moveCacheSlots.FROM],
                dir: this.player.dirImgIndex
            },
            updatePack:{
                x: this.player.gameObjCont.x,
                y: this.player.gameObjCont.y,
                dir: this.player.dirImgIndex
            }
        });

        //------------------------ ALL OTHER NETWORK CALLS

        // Update all info (map, players, etc. as needed);
        Network.CreateResponse("UpdateFromServer", function (serverSpriteUpdates) {
            // Use this format to exclude player without needing additional checks
            // TODO: Maybe make this safer? Make sure there is never a mismatch between sprite lists...
            for (var type in self.sprites) {
                for (var id in self.sprites[type]) {
                    // Get their image info, tubb info, etc. Need to create the full object at least visually.
                    if (serverSpriteUpdates[type][id])
                        self.sprites[type][id].ServerUpdate(serverSpriteUpdates[type][id]);
                    else
                        console.log("Tried to update non-existant " + type + ", id: " + id);
                }
            }
        });

        // Remove any sprite, including players
        function RemoveSpriteCallback(mapSprite) {
            // TODO: Other removal things as needed (exit animation for players? Handle any world interactions/events/etc.)
            if (self.sprites[mapSprite.spriteType][mapSprite.id]) {
                self.sprites[mapSprite.spriteType][mapSprite.id].gameObjCont.destroy();
                delete self.sprites[mapSprite.spriteType][mapSprite.id];
            }
            else {
                // Incase "GetServerGameData" has not yet been called and player with that id has not yet been added to this client,
                // Recursively call this function until it is done.
                setTimeout(function () {
                    RemoveSpriteCallback(mapSprite);
                } , 250);
            }
        }
        Network.CreateResponse("RemoveSprite", RemoveSpriteCallback);
        
        function MoveSpriteCallback(moveData) {
            // TODO: Other removal things as needed (exit animation for players? Handle any world interactions/events/etc.)
            if (self.sprites[moveData.mapData.spriteType][moveData.mapData.id]) {
                self.sprites[moveData.mapData.spriteType][moveData.mapData.id].MoveTo(moveData.cell, moveData.dir);
            }
            else {
                // Incase "GetServerGameData" has not yet been called and player with that id has not yet been added to this client,
                // Recursively call this function until it is done.
                setTimeout(function () {
                    MoveSpriteCallback(moveData);
                } , 500);
            }
        }
        Network.CreateResponse("MoveNetSprite", MoveSpriteCallback);
    }

    update() {
        this.player.Update();

        for (var type in this.sprites)
            for (var id in this.sprites[type])
                this.sprites[type][id].Update();
    }

    get MapTileWidth() {
        return this.map.tileWidth
    }

    get MapTileHeight() {
        return this.map.tileHeight
    }
}