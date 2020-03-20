class Sprite {

    scene;

    gameObjCont;
    sprite;
    name;

    dirIndex;

    constructor(scene, initGridSpawn, spritesheetKey, dirIndex, name) {
        this.scene = scene;

        this.gameObjCont = scene.add.container(
            initGridSpawn.x * scene.MapTileWidth, 
            initGridSpawn.y * scene.MapTileHeight
        );
        
        this.dirIndex = dirIndex;
        this.sprite = scene.add.sprite(16, 16, spritesheetKey, 0);
        //this.sprite.setScale(1, 1.25);
        this.sprite.anims.play('walk_' + dirIndex);

        this.gameObjCont.add(this.sprite);
        this.name = name || 'I am Error';
    }

    ChangeDirection(dirIndex) {
        if(this.dirIndex == dirIndex)
            return;

        this.dirIndex = dirIndex;
        this.sprite.anims.play('walk_' + dirIndex);
    }
}