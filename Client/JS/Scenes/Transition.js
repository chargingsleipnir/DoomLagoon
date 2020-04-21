class SceneTransition extends Phaser.Scene {

    constructor(sceneName) {
        super(sceneName);

        this.MASK_MAX_SCALE = 2;
        this.TRANSITION_TIME = 2000;

        this.mask;
        this.transitionOpen = true;
    }

    init() {
        // TODO: Make this rectangular, at the exact aspect ratio of the canvas, for perfect scaling.
        var halfW = Main.phaserConfig.width * 0.5,
        halfH = Main.phaserConfig.height * 0.5;

        const maskShape = new Phaser.Geom.Circle( halfW, halfH, halfH );
        this.add.graphics().fillCircleShape(maskShape).generateTexture('mask');
        this.mask = this.add.image(0, 0, 'mask').setPosition(halfW, halfH);

        this.cameras.main.setMask(new Phaser.Display.Masks.BitmapMask(this, this.mask));
    }

    create() {
        this.events.on(Phaser.Scenes.Events.TRANSITION_OUT, () => {
            const propertyConfig = { ease: 'Expo.easeInOut', from: this.MASK_MAX_SCALE, start: this.MASK_MAX_SCALE, to: 0 };

            this.tweens.add({
                duration: this.TRANSITION_TIME,
                scaleX: propertyConfig,
                scaleY: propertyConfig,
                targets: this.mask,
            });
        });

        this.events.on(Phaser.Scenes.Events.CREATE, () => {
            if(!this.transitionOpen)
                return;

            const propertyConfig = { ease: 'Expo.easeInOut', from: 0, start: 0, to: this.MASK_MAX_SCALE };
            this.tweens.add({
                delay: this.TRANSITION_TIME,
                duration: this.TRANSITION_TIME,
                scaleX: propertyConfig,
                scaleY: propertyConfig,
                targets: this.mask,
            });
        });
    }
}