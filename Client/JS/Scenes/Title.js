class Title extends Phaser.Scene {

    constructor() {
        super("Title");
    }

    preload ()
    {        
        this.load.image('TitleBG', '../../Assets/Overworld.png');

        // Loading this one scene early so in the next scene, my primary loader, I can use this file's data for sprite sheet loading.
        this.load.json('AnimData', '../../JS/Sprites/AnimationData.json');
    }

    create ()
    {
        GameAudio.SetMusicClip("titleAndOverworld", true, true, 0);
        GameAudio.FadeIn(1);

        // As commented above
        Main.animData = this.cache.json.get('AnimData');

        this.scene.launch("Loader");
    }
}