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
        // TODO: The zero here is having the character start off facing an incorrect direction.
        // I think I need a single idle image/frame for each direction.
        this.sprite = scene.add.sprite(16, 8, spritesheetKey, 0);        

        this.gameObjCont.add(this.sprite);
        this.name = name || 'I am Error';
    }

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

        this.sprite.anims.play('overworld_walk_' + dirIndex);
        this.prevDirIndex = this.dirIndex;
    }
}