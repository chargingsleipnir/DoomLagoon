// TODO: Only ever put this scene to sleep, so it does not repeat the init and create calls.
class Overworld extends TiledMapScene {

    sprites = {};

    constructor() {
        super("Overworld");

        this.sprites[Consts.spriteTypes.PLAYER] = {};
        this.sprites[Consts.spriteTypes.ENEMY] = {};
        this.sprites[Consts.spriteTypes.NPC] = {};
    }

    // TODO: All anims
    // TODO: Title page, game-map style with land formed to say "Doom Lagoon"
    // TODO: Show controls on options menu
    // TODO: Audio

    preload() {
        Main.animData.skins.forEach((skin) => {
            this.load.spritesheet(Main.animData.overworld.skinPrefix + skin, '../../Assets/Sprites/' + Main.animData.overworld.skinPrefix + skin + '.png', { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 1 });
        }, this);

        this.LoadMapData('DataFiles/OverworldTilesetsEmbeded.json');

        // Terrain
        this.load.image('tileset_General', '../../Assets/Map/pipo-map001_Extruded.png');
        this.load.image('tileset_Grass', '../../Assets/Map/pipo-map001_at-kusa.png');
        this.load.image('tileset_Trees', '../../Assets/Map/pipo-map001_at-mori.png');
        this.load.image('tileset_Sand', '../../Assets/Map/pipo-map001_at-sabaku.png');
        this.load.image('tileset_Dirt', '../../Assets/Map/pipo-map001_at-tuti.png');
        this.load.image('tileset_Water', '../../Assets/Map/pipo-map001_at-umi.png');
        this.load.image('tileset_MountainBrown', '../../Assets/Map/pipo-map001_at-yama2.png');
        this.load.image('tileset_MountainGrey', '../../Assets/Map/pipo-map001_at-yama3.png');

        // Single images for Tiled object layer items
        this.load.image('sign', '../../Assets/Map/Sign.png');
        this.load.image('spring', '../../Assets/Map/Spring.png');
        this.load.image('volcano', '../../Assets/Map/VolcaonActive.png');

        this.load.image('chestBrownClosed', '../../Assets/Map/ChestBrownClosed.png');
        this.load.image('chestBrownOpen', '../../Assets/Map/ChestBrownOpen.png');
        this.load.image('chestGreenClosed', '../../Assets/Map/ChestGreenClosed.png');
        this.load.image('chestGreenOpen', '../../Assets/Map/ChestGreenOpen.png');
    }

    create(serverPlayerData) {
        super.create();

        Main.animData.skins.forEach((skin) => {
            Main.animData.overworld.keys.forEach((key) => {
                this.anims.create({
                    key	: skin + '-' + key,
                    frames : this.anims.generateFrameNumbers(Main.animData.overworld.skinPrefix + skin, { start: Main.animData.overworld.frames[key].start, end: Main.animData.overworld.frames[key].end }),
                    repeat : Main.animData.overworld.repeat,
                    frameRate : Main.animData.overworld.frameRate
                });
            }, this);
        }, this);

        // TODO: localPlayerData.upgrades needs to effect which chests are open for this player.
        // Open all chests with equal or lesser valued contents...?
        // I suppose it would be OK if chests always started closed regardless....
        // Whichever ultimately looks/seems better. (???)
        Main.player = new LocalPlayer(this, serverPlayerData);
        
        this.cameras.main.startFollow(Main.player.gameObjCont);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setRoundPixels(true);

        // TODO: Institute a "HideSaveBtn" if there should ever be a "reset" functionality beyond rereshing the browser.
        OptionsMenu.ShowSaveBtn();

        Network.Emit("Play");

        var self = this;
        //------------------------ SETUP NETWORK CALLS

        // First emission sent from server - assign proper id, setup map, etc.
        Network.CreateResponse("GetServerGameData", function (data) {
            //console.log(data);
            for (let i = 0; i < data.sprites.length; i++) {
                var isPlayer = data.sprites[i].type == Consts.spriteTypes.PLAYER;
                self.sprites[data.sprites[i].type][data.sprites[i].id] = new NetSprite(
                    self, 
                    data.sprites[i].gridPos, 
                    data.sprites[i].assetKey,
                    data.sprites[i].dir,
                    data.sprites[i].name, 
                    data.sprites[i].id, 
                    isPlayer
                );
            }
        });

        // and tell everyone else about player. Adding new players after this player has joined
        Network.CreateResponse("AddNewPlayer", function (playerData) {
            //console.log(playerData);
            self.sprites[Consts.spriteTypes.PLAYER][playerData.id] = new NetSprite(
                self, 
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
        Network.CreateResponse("RecCommenceBattle", function (battleData) {
            console.log("From overworld, starting battle scene: ", battleData);
            self.scene.wake("Battle", battleData);
        });

        //* Launch and put to sleep immediately, so it's just always on standby, only to ever be slept and awaken.
        self.scene.launch("Battle");
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