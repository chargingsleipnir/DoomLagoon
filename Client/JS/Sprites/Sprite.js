class Sprite {

    scene;

    gameObjCont;
    sprite;
    name;

    dirIndex;
    prevDirIndex;

    constructor(scene, initGridSpawn, spritesheetKey, dirIndex, name) {
        this.scene = scene;

        this.gameObjCont = scene.add.container(
            initGridSpawn.x * scene.MapTileWidth, 
            initGridSpawn.y * scene.MapTileHeight
        );
        
        this.dirIndex = dirIndex;

        var frameKey = Main.animData.keys[dirIndex];
        this.sprite = scene.add.sprite(16, 8, spritesheetKey, Main.animData.frames[frameKey].start);

        this.gameObjCont.add(this.sprite);
        this.name = name || 'I am Error';
    }

    // TODO: Clean this up. Yes, it works, but at what cost...
    Anim_Stop() {
        if(!this.sprite.anims.isPlaying)
            return;

        this.sprite.anims.stop();
        this.prevDirIndex = -1;
    }

    ChangeDirection(dirIndex) {
        this.dirIndex = dirIndex;

        if(this.prevDirIndex == this.dirIndex)
            return;

        this.sprite.anims.play("FighterAxeBlue-" + Main.animData.keys[dirIndex]);
        this.prevDirIndex = this.dirIndex;
    }

    SetSkin(skinID) {

    }
}