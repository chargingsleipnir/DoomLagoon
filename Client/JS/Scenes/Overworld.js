// TODO: Only ever put this scene to sleep, so it does not repeat the init and create calls.
class Overworld extends TiledMapScene {

    constructor() {
        super("Overworld");

        this.sprites = {};
        this.sprites[Consts.spriteTypes.PLAYER] = {};
        this.sprites[Consts.spriteTypes.ENEMY] = {};
        this.sprites[Consts.spriteTypes.NPC] = {};
    }

    init() {
        super.init();
        //this.mask.setScale(this.MASK_MAX_SCALE);

        InGameGUI.Init(this);
    }

    create(transferData) {
        super.create();

        Main.spriteData.skins.forEach((skin) => {
            Main.spriteData.overworld.keys.forEach((key) => {
                this.anims.create({
                    key	: skin + '-' + key,
                    frames : this.anims.generateFrameNumbers(`${Main.spriteData.overworld.skinPrefix}_${skin}`, { start: Main.spriteData.overworld.frames[key].start, end: Main.spriteData.overworld.frames[key].end }),
                    repeat : Main.spriteData.overworld.repeat,
                    frameRate : Main.spriteData.overworld.frameRate
                });
            }, this);
        }, this);

        // TODO: localPlayerData.upgrades needs to effect which chests are open for this player.
        // Open all chests with equal or lesser valued contents...?
        // I suppose it would be OK if chests always started closed regardless....
        // Whichever ultimately looks/seems better. (???)
        Main.player = new LocalPlayer(this, transferData.serverPlayer);
        
        this.cameras.main.startFollow(Main.player.gameObjCont);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setRoundPixels(true);

        //------------------------ SETUP NETWORK CALLS

        // First emission sent from server - assign proper id, setup map, etc.
        Network.CreateResponse("GetServerGameData", (data) => {
            console.log(`Initial sprite data from server: `, data);
            for (let i = 0; i < data.sprites.length; i++) {
                var isPlayer = data.sprites[i].type == Consts.spriteTypes.PLAYER;
                this.sprites[data.sprites[i].type][data.sprites[i].id] = new NetSprite(
                    this, 
                    data.sprites[i].gridPos, 
                    data.sprites[i].assetKey,
                    data.sprites[i].dir,
                    data.sprites[i].name, 
                    data.sprites[i].id, 
                    isPlayer
                );
            }

            Main.player.active = true;
        });

        // and tell everyone else about player. Adding new players after this player has joined
        Network.CreateResponse("AddNewPlayer", (playerData) => {
            //console.log(playerData);
            this.sprites[Consts.spriteTypes.PLAYER][playerData.id] = new NetSprite(
                this, 
                playerData.gridPos,
                playerData.assetKey, 
                playerData.dir,  
                playerData.name, 
                playerData.id, 
                true
            );
        });

        //------------------------ ALL OTHER NETWORK CALLS

        // Update all info (map, players, etc. as needed);
        Network.CreateResponse("UpdateFromServer", (serverSpriteUpdates) => {
            // Use this format to exclude player without needing additional checks
            // TODO: Maybe make this safer? Make sure there is never a mismatch between sprite lists...
            for (var type in this.sprites) {
                for (var id in this.sprites[type]) {
                    // Get their image info, tubb info, etc. Need to create the full object at least visually.
                    if (serverSpriteUpdates[type][id])
                        this.sprites[type][id].ServerUpdate(serverSpriteUpdates[type][id]);
                    else
                        console.warn(`Tried to update sprite that exists on this client but not on the server, type ${type}, id: ${id}`);
                }
            }
        });

        Network.CreateResponse("UpdateMapSpriteAssetKey", (mapSprite) => {
            if (this.sprites[Consts.spriteTypes.PLAYER][mapSprite.id]) {
                this.sprites[Consts.spriteTypes.PLAYER][mapSprite.id].UpdateTexture(mapSprite.assetKey);
            }
        });

        var self = this;
        // Remove any sprite, including players
        function RemoveMapSpriteCallback(mapSprite) {
            // TODO: Other removal things as needed (exit animation for players? Handle any world interactions/events/etc.)
            if (self.sprites[mapSprite.spriteType][mapSprite.id]) {
                self.sprites[mapSprite.spriteType][mapSprite.id].gameObjCont.destroy();
                delete self.sprites[mapSprite.spriteType][mapSprite.id];
            }
            else {
                // Incase "GetServerGameData" has not yet been called and player with that id has not yet been added to this client,
                // Recursively call this function until it is done.
                setTimeout(function () {
                    RemoveMapSpriteCallback(mapSprite);
                }, 250);
            }
        }
        Network.CreateResponse("RemoveMapSprite", RemoveMapSpriteCallback);
        
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

        // BATTLE SCENE!
        Network.CreateResponse("RecCommenceBattle", (battleData) => {
            console.log("From overworld, starting battle scene, received data: ", battleData);
            
            GameAudio.FadeOut(0.5, () => {
                this.scene.wake("Battle", battleData);
            });
        });

        Network.Emit("Play");

        //* Launch and put to sleep immediately, so it's just always on standby, only to ever be slept and awaken.
        this.scene.launch("Battle");
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