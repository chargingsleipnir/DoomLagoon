class Title extends SceneTransition {

    constructor() {
        super("Title");
        this.transitionOpen = false;
    }

    // TODO: This is only for showing initial loading taking place, thus, have it fade in slowly just so if the
    // loading happens very quickly, it isn't too jarring.

    init() {
        // TODO: This only ever needs to happen once throughout the lifetime of the game, but these functions get called for each scene change...
        // I should find out if each scene has access to a one-time call no matter how mnay times the scenes change
        document.getElementById("InGameOptionsBtn").addEventListener('click', OptionsMenu.Open);
    }

    preload ()
    {
        // TODO: Erase these template items
        this.load.setBaseURL('http://labs.phaser.io');
        this.load.image('sky', 'assets/skies/space3.png');
        this.load.image('logo', 'assets/sprites/phaser3-logo.png');
        this.load.image('red', 'assets/particles/red.png');
    }

    create ()
    {
        super.create();
        // Increase the size just for this openner.
        this.mask.setScale(this.MASK_MAX_SCALE);

        this.add.image(500, 300, 'sky');

        this.add.text(20, 20, "Loading game...");

        var particles = this.add.particles('red');

        var emitter = particles.createEmitter({
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD'
        });

        var logo = this.physics.add.image(400, 100, 'logo');

        logo.setVelocity(100, 200);
        logo.setBounce(1, 1);
        logo.setCollideWorldBounds(true);

        emitter.startFollow(logo);

        var scene = this;
        // Check local storage, database info, etc. to pass to play state
        Network.CreateResponse("RecWorldInitData", function (data) {

            //console.log("RecWorldInitData received:", data);

            if(!Main.userPrefs.useDBStorage && Main.userPrefs.useLocalStorage) {
                // local storage can be selected, but still empty if it wasn't saved into yet.
                var storeData = localStorage.getItem(Network.LOCAL_STORAGE_KEY);
                if(storeData)
                    data = JSON.parse(storeData);
            }

            scene.input.on('pointerdown', () => {
                scene.scene.transition({
                    duration: scene.TRANSITION_TIME,
                    target: 'Overworld',
                    data: data
                });
            });
            
        });
        Network.Emit("ReqWorldInitData");
    }

}