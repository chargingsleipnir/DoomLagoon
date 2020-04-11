// This will essentially be the preloader, showing loading bars if necessary,
// And only when that's done, allowing click/enter-to-play, etc.

// TODO: What would probably make the most sense to achieve this, is:
// a) A proper title scene to load the background/load bars, then
// b) Another scene (Loader) within this one (doesn't drop those assets yet), just extends the load bars while loading everything else.

class Title extends SceneTransition {

    constructor() {
        super("Title");
        this.transitionOpen = false;
    }

    init() {
        // TODO: This only ever needs to happen once throughout the lifetime of the game, but these functions get called for each scene change...
        // I should find out if each scene has access to a one-time call no matter how mnay times the scenes change
        document.getElementById("InGameOptionsBtn").addEventListener('click', OptionsMenu.Open);
    }

    preload ()
    {
        this.load.json('AnimData', '../../JS/Sprites/AnimationData.json');
        this.load.image('TitleBG', '../../Assets/Overworld.png');
    }

    create ()
    {
        super.create();
        
        let bg = this.add.image(Main.phaserConfig.width * 0.5, Main.phaserConfig.height * 0.5, 'TitleBG');
        bg.displayWidth = Main.phaserConfig.width;
        bg.scaleY = bg.scaleX;

        // TODO: This can't really reference the file this deeply once I'm getting other animations in play
        Main.animData = this.cache.json.get('AnimData');

        // Increase the size just for this openner.
        this.mask.setScale(this.MASK_MAX_SCALE);

        this.add.text(400, 100, "Loading game...");

        var scene = this;
        // Check local storage, database info, etc. to pass to play state
        Network.CreateResponse("RecBuiltPlayer", function (playerData) {
            scene.scene.transition({
                duration: scene.TRANSITION_TIME,
                target: 'Overworld',
                data: playerData
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

        // TODO: I guess I'll have to adapt this to send all of the local storage data, not just orientation
        scene.input.on('pointerdown', () => {
            Network.Emit("ReqBuildPlayer", {
                localStorage: localStorageData,
                dispName: MainMenu.GetDispName()
            });
        });
    }
}