class Title extends Phaser.Scene {
    
    constructor() {
        super("Title");
    }

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
        this.add.text(20, 20, "Loading game...");

        this.add.image(400, 300, 'sky');

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

        //this.scene.start("Overworld");
    }

}