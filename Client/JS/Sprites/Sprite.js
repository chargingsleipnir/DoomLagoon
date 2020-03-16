class Sprite {

    scene;

    gameObjCont;
    sprite;
    name;
    imageKeysArr;

    dirImgIndex;

    //* imageKeysArr should be in order of left, right, up, and down, as consistent with Consts.dirImg
    constructor(scene, initGridSpawn, imageKeysArr, dirImgIndex, name) {
        this.scene = scene;
        
        this.imageKeysArr = imageKeysArr;

        this.gameObjCont = scene.add.container(
            initGridSpawn.x * scene.MapTileWidth, 
            initGridSpawn.y * scene.MapTileHeight
        );
        
        this.dirImgIndex = dirImgIndex;
        this.sprite = scene.add.sprite(16, 16, imageKeysArr[this.dirImgIndex]);
        
        this.gameObjCont.add(this.sprite);
        this.name = name || 'I am Error';
    }

    ChangeDirection(imgIndex) {
        if(this.dirImgIndex == imgIndex)
            return;

        this.dirImgIndex = imgIndex;
        this.sprite.setTexture(this.imageKeysArr[imgIndex]);
    }
}