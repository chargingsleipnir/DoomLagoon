// TODO: Only ever put this scene to sleep, so it does not repeat the init and create calls.
class Overworld extends TiledMapScene {

    sprites = {};

    constructor() {
        super("Overworld");

        this.sprites[Consts.spriteTypes.PLAYER] = {};
        this.sprites[Consts.spriteTypes.ENEMY] = {};
        this.sprites[Consts.spriteTypes.NPC] = {};
    }

    preload() {
        this.load.spritesheet('knightRedAxe_Walk', '../../Assets/Sprites/KnightAxeRed_Walking.png', { frameWidth: 32, frameHeight: 32 });

        this.LoadMapFiles('DataFiles/mapPH.json', '../../Assets/Map/tilesetPH.png');
    }

    create(initData) {
        //console.log("Startup save data: " , initData);
        super.create();

        var self = this;
        function CreateAnim(dirKey, spritesheetKey, startFrame, endFrame) {
            self.anims.create({
                key: 'walk_' + dirKey,
                repeat: -1,
                frameRate: 12,
                frames: self.anims.generateFrameNames(spritesheetKey, { start: startFrame, end: endFrame })
            });
        }

        CreateAnim(Consts.dirImg.LEFT, 'knightRedAxe_Walk', 0, 5);
        CreateAnim(Consts.dirImg.RIGHT, 'knightRedAxe_Walk', 6, 11);
        CreateAnim(Consts.dirImg.UP, 'knightRedAxe_Walk', 12, 17);
        CreateAnim(Consts.dirImg.DOWN, 'knightRedAxe_Walk', 18, 23);

        Main.player = new LocalPlayer(this, initData.orientation, 'knightRedAxe_Walk');
        
        this.cameras.main.startFollow(Main.player.gameObjCont);
        //this.cameras.main.setZoom(2);

        // TODO: Institute a "HideSaveBtn" if there should ever be a "reset" functionality beyond rereshing the browser.
        OptionsMenu.ShowSaveBtn();

        //------------------------ SETUP NETWORK CALLS

        // First emission sent from server - assign proper id, setup map, etc.
        Network.CreateResponse("GetServerGameData", function (data) {
            for (let i = 0; i < data.sprites.length; i++) {
                // TODO: Include direction
                self.sprites[data.sprites[i].type][data.sprites[i].id] = new NetSprite(
                    self, 
                    data.sprites[i].gridPos, 
                    'knightRedAxe_Walk', 
                    data.sprites[i].dir,  
                    data.sprites[i].name, 
                    data.sprites[i].id, 
                    data.sprites[i].type == Consts.spriteTypes.PLAYER
                );
            }
        });

        // and tell everyone else about player. Adding new players after this player has joined
        Network.CreateResponse("AddNewPlayer", function (playerData) {
            self.sprites[Consts.spriteTypes.PLAYER][playerData.id] = new NetSprite(
                self, 
                playerData.gridPos, 
                'knightRedAxe_Walk', 
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
                name: Main.player.name,
                gridPos: {
                    x: Main.player.moveCache_Grid[Consts.moveCacheSlots.FROM].x,
                    y: Main.player.moveCache_Grid[Consts.moveCacheSlots.FROM].y
                },
                dir: Main.player.dirIndex
            },
            updatePack:{
                x: Main.player.gameObjCont.x,
                y: Main.player.gameObjCont.y,
                dir: Main.player.dirIndex
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
                }, 250);
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
        Main.player.Update();

        for (var type in this.sprites)
            for (var id in this.sprites[type])
                this.sprites[type][id].Update();
    }

    // TODO: Leftover from old code. Implement?
    /*
    render() {
        game.debug.cameraInfo(game.camera, 32, 32);
        game.debug.spriteCoords(player, 320, 32);
    }*/
}