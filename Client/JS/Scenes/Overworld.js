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
            this.load.spritesheet(Main.animData.skinPrefix + skin, '../../Assets/Sprites/' + Main.animData.skinPrefix + skin + '.png', { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 1 });
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
    
        // BATTLE SCENE
        this.load.image('battleBG_Grass_House_01', '../../Assets/BattleBackgrounds/Grass_House_01.png');
        this.load.image('battleMenuBG', '../../Assets/GUI/Menu_450x100.png');
    }

    create(initData) {
        super.create();

        Main.animData.skins.forEach((skin) => {
            Main.animData.keys.forEach((key) => {
                this.anims.create({
                    key	: skin + '-' + key,
                    frames : this.anims.generateFrameNumbers(Main.animData.skinPrefix + skin, { start: Main.animData.frames[key].start, end: Main.animData.frames[key].end }),
                    repeat : Main.animData.repeat,
                    frameRate : Main.animData.frameRate
                });
            }, this);
        }, this);

        // TODO: 'FighterAxeBlue' will actually come from save data first, default to this for new player
        Main.player = new LocalPlayer(this, initData.orientation, 'FighterAxeBlue');
        
        this.cameras.main.startFollow(Main.player.gameObjCont);
        this.cameras.main.setZoom(1.5);
        this.cameras.main.setRoundPixels(true);

        // TODO: Institute a "HideSaveBtn" if there should ever be a "reset" functionality beyond rereshing the browser.
        OptionsMenu.ShowSaveBtn();

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
                    isPlayer ? 'FighterAxeBlue' : data.sprites[i].name, // TODO: This includes existing players as well.
                    data.sprites[i].dir,  
                    data.sprites[i].name, 
                    data.sprites[i].id, 
                    isPlayer
                );
            }
        });

        // and tell everyone else about player. Adding new players after this player has joined
        Network.CreateResponse("AddNewPlayer", function (playerData) {
            self.sprites[Consts.spriteTypes.PLAYER][playerData.id] = new NetSprite(
                self, 
                playerData.gridPos,
                // TODO: 'FighterAxeBlue' will actually come from that player's save data first, default to this for new player
                'FighterAxeBlue', 
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

        // BATTLE SCENE!
        Network.CreateResponse("RecCommenceBattle", function (battleData) {
            // scene.scene.transition({
            //     duration: scene.TRANSITION_TIME,
            //     target: "Battle",
            //     data: battleData
            // });

            console.log("Overworld starting battle scene: ", battleData);

            // TODO: Maybe just transition smoothly from in the sceen itself, no need to use the phaser transition system.
            // Let it last a couple seconds so the player can see the units actually approach properly, as they're still entering their respective tiles when this is called.
            if(self.scene.isSleeping("Battle")) {
                self.scene.wake("Battle", battleData);
            }
            else {
                self.scene.launch("Battle", battleData);
            }
        });
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