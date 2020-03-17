class SceneTransition extends Phaser.Scene {

    MASK_MAX_SCALE = 2;
    TRANSITION_TIME = 2000;

    mask;
    transitionOpen;

    constructor(sceneName) {
        super(sceneName);
        this.transitionOpen = true;
    }

    create() {

        // TODO: Make this rectangular, at the exact aspect ratio of the canvas, for perfect scaling.
        var halfW = Main.phaserConfig.width * 0.5,
        halfH = Main.phaserConfig.height * 0.5;

        const maskShape = new Phaser.Geom.Circle( halfW, halfH, halfH );
        this.add.graphics().fillCircleShape(maskShape).generateTexture('mask');
        this.mask = this.add.image(0, 0, 'mask').setPosition(halfW, halfH);

        this.cameras.main.setMask(new Phaser.Display.Masks.BitmapMask(this, this.mask));

        var scene = this;
        this.events.on(Phaser.Scenes.Events.TRANSITION_OUT, () => {

            console.log("Scene transition out event");

            // TODO: This was heavily messing up the transitions - Find some other way to freeze the game when transitions start
            //scene.scene.pause();

            const propertyConfig = {
                ease: 'Expo.easeInOut',
                from: scene.MASK_MAX_SCALE,
                start: scene.MASK_MAX_SCALE,
                to: 0,
            };

            scene.tweens.add({
                duration: this.TRANSITION_TIME,
                scaleX: propertyConfig,
                scaleY: propertyConfig,
                targets: scene.mask,
            });
        });

        this.events.on(Phaser.Scenes.Events.CREATE, () => {

            if(!this.transitionOpen)
                return;

            const propertyConfig = {
                ease: 'Expo.easeInOut',
                from: 0,
                start: 0,
                to: scene.MASK_MAX_SCALE,
            };
        
            scene.tweens.add({
                delay: this.TRANSITION_TIME,
                duration: this.TRANSITION_TIME,
                scaleX: propertyConfig,
                scaleY: propertyConfig,
                targets: scene.mask,
            });
        });
    }
}