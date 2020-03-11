class Sprite {

    gameObjCont;
    sprite;
    name;
    imageKeysArr;

    dirImgIndex;

    //* imageKeysArr should be in order of left, right, up, and down, as consistent with Consts.dirImg
    constructor(scene, initGridPos, imageKeysArr, dirImgIndex, name) {
        this.imageKeysArr = imageKeysArr;

        this.gameObjCont = scene.add.container(
            initGridPos.x * scene.MapTileWidth, 
            initGridPos.y * scene.MapTileHeight
        );
        
        // Start down just be default, could be anything

        this.dirImgIndex = dirImgIndex || Consts.dirImg.DOWN;
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