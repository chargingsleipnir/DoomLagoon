class Loader extends SceneTransition {

    constructor() {
        super("Loader");
        this.transitionOpen = false;
    }

    init() {
        super.init();

        let bg = this.add.image(Main.phaserConfig.width * 0.5, Main.phaserConfig.height * 0.5, 'TitleBG');
        bg.displayWidth = Main.phaserConfig.width;
        bg.scaleY = bg.scaleX;

        // Increase the size just for this openner.
        this.mask.setScale(this.MASK_MAX_SCALE);
    }

    preload ()
    {
        var centreW = Main.phaserConfig.width * 0.5;
        var centreH = Main.phaserConfig.height * 0.5;

        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(centreW - 210, centreH - 30, 420, 60);

        var loadingText = this.make.text({ x: centreW, y: centreH - 45, text: 'Loading...', style: Consts.STYLE_DISP_NAME });
        loadingText.setOrigin(0.5, 0.5);
        var percentText = this.make.text({ x: centreW, y: centreH, text: '0%', style: Consts.STYLE_DISP_NAME });
        percentText.setOrigin(0.5, 0.5);
        var assetText = this.make.text({ x: centreW, y: centreH + 45, text: '', style: Consts.STYLE_DISP_NAME });
        assetText.setOrigin(0.5, 0.5);

        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(centreW - 200, centreH - 20, 400 * value, 40);
            percentText.setText(`${parseInt(value * 100)}%`);
        });       
        this.load.on('fileprogress', function (file) {
            assetText.setText(`Loading asset: ${file.src}`);
        });
        this.load.on('complete', function () {
            loadingText.destroy();
            percentText.setText("Press ENTER to start!");
            assetText.destroy();
        });
        
        Main.spriteData.skins.forEach((skin) => {
            this.load.spritesheet(`${Main.spriteData.overworld.skinPrefix}_${skin}`, `../../Assets/Sprites/${skin}/WALK.png`, { frameWidth: 32, frameHeight: 32, margin: 1, spacing: 1 });
        }, this);

        // ==================================== OVERWORLD SCENE

        this.load.tilemapTiledJSON('tilemap', 'DataFiles/OverworldTilesetsEmbeded.json');
        
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

        // Chests
        this.load.image('chestBrownClosed', '../../Assets/Map/ChestBrownClosed.png');
        this.load.image('chestBrownOpen', '../../Assets/Map/ChestBrownOpen.png');
        this.load.image('chestGreenClosed', '../../Assets/Map/ChestGreenClosed.png');
        this.load.image('chestGreenOpen', '../../Assets/Map/ChestGreenOpen.png');
        // Icons for chest contents
        this.load.image('iconSword', '../../Assets/Icons/Sword.png');
        this.load.image('iconCape', '../../Assets/Icons/Cape.png');
        this.load.image('iconLance', '../../Assets/Icons/Lance.png');
        this.load.image('iconShield', '../../Assets/Icons/Shield.png');
        this.load.image('iconArmour', '../../Assets/Icons/Armour.png');
        this.load.image('iconBookGreen', '../../Assets/Icons/BookGreen.png');
        this.load.image('iconBookRed', '../../Assets/Icons/BookRed.png');

        // ==================================== BATTLE SCENE

        this.load.image('battleBG_Field', '../../Assets/BattleBackgrounds/Grass_House.png');
        this.load.image('battleBG_Sand', '../../Assets/BattleBackgrounds/Desert.png');
        this.load.image('battleBG_Iron', '../../Assets/BattleBackgrounds/Mountain.png');
        this.load.image('battleBG_Volcano', '../../Assets/BattleBackgrounds/Lava.png');
        this.load.image('battleBG_Ruin', '../../Assets/BattleBackgrounds/Ruin.png');
        
        this.load.image('battleMenuBG', '../../Assets/GUI/Menu_450x100.png');
        this.load.image('battleMenuMask', '../../Assets/GUI/menuMask_424x74.png');
        this.load.image('battleMenuCursor', '../../Assets/GUI/arrowRight_32x32.png');

        //* Being able to loop through this depends on very specific naming conventions using the "skin" and "move" names.
        for(let i = 0; i < Main.spriteData.skins.length; i++) {
            let skin = Main.spriteData.skins[i];
            for(let j = 0; j < Main.spriteData.battle.moveKeys.length; j++) {
                let move = Main.spriteData.battle.moveKeys[j];
                let frame = Main.spriteData.battle.frameDetails[i][j];
                if(frame != null)
                    this.load.spritesheet(`${Main.spriteData.battle.skinPrefix}_${move}_${skin}`, `../../Assets/Sprites/${skin}/${move}.png`, { frameWidth: frame.w, frameHeight: frame.h, margin: 0, spacing: 0 });
            }
        }
    }

    create ()
    {
        super.create();

        var scene = this;
        // Check local storage, database info, etc. to pass to play state
        Network.CreateResponse("RecBuiltPlayer", function (playerData) {

            var transferData = {
                serverPlayer: playerData
            };

            scene.scene.transition({
                duration: scene.TRANSITION_TIME,
                target: 'Overworld',
                data: transferData
            });            
        });

        // Check for local storage, and if it's there, send it's orientation object to the server to check against database slot used.
        var localStorageData = null;
        if(!Main.userPrefs.useDBStorage && Main.userPrefs.useLocalStorage) {
            // local storage can be selected, but still empty if it wasn't saved into yet.
            var storeData = localStorage.getItem(Network.LOCAL_STORAGE_KEY);
            if(storeData)
                localStorageData = JSON.parse(storeData);
        }

        var startingOverworld = false;
        this.input.keyboard.on('keydown_ENTER', () => {
            if(startingOverworld) {
                console.warn("Overworld loading. Patience is a virtue.");
                return;
            }

            startingOverworld = true;

            Network.Emit("ReqBuildPlayer", {
                localStorage: localStorageData,
                dispName: MainMenu.GetDispName()
            });
        });
    }
}