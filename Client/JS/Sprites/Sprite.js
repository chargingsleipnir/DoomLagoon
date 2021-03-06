class Sprite {

    constructor(scene, initGridSpawn, assetKey, dirIndex, name) {
        this.scene = scene;
        this.isMoving = false;

        this.gameObjCont = scene.add.container(
            initGridSpawn.x * scene.MapTileWidth, 
            initGridSpawn.y * scene.MapTileHeight
        );
        
        this.dirIndex = dirIndex;

        this.assetKey = assetKey;
        var frameKey = Main.spriteData.overworld.keys[dirIndex];
        this.sprite = scene.add.sprite(16, 8, `${Main.spriteData.overworld.skinPrefix}_${assetKey}`, Main.spriteData.overworld.frames[frameKey].start);

        this.gameObjCont.add(this.sprite);
        this.name = name || 'I am Error';

        this.prevDirIndex = -1;
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

        this.sprite.anims.play(this.assetKey + "-" + Main.spriteData.overworld.keys[dirIndex]);
        this.prevDirIndex = this.dirIndex;
    }

    UpdateTexture(newAssetKey) {
        this.assetKey = newAssetKey;
        var frameKey = Main.spriteData.overworld.keys[this.dirIndex];
        this.sprite.setTexture(`${Main.spriteData.overworld.skinPrefix}_${this.assetKey}`, Main.spriteData.overworld.frames[frameKey].start);
    }
}