class NPC {

    gameObjCont;
    sprite;
    name;
    imageKeysArr;

    dirImgIndex;

    //* imageKeysArr should be in order of left, right, up, and down, as consistent with constants.DIR_IMG
    constructor(scene, initGridPos, imageKeysArr, name) {
        var initPixelPos = {
            x: initGridPos.x * Constants.TILE_SIZE,
            y: initGridPos.y * Constants.TILE_SIZE
        }

        this.imageKeysArr = imageKeysArr;

        this.gameObjCont = scene.add.container(initPixelPos.x, initPixelPos.y);
        
        // Start down just be default, could be anything
        this.dirImgIndex = Constants.DIR_IMG.DOWN;
        this.sprite = scene.add.sprite(0, 0, imageKeysArr[this.dirImgIndex]);
        
        this.gameObjCont.add(this.sprite);
        this.name = name || 'I am Error';
    }

    ChangeDirection(dirCommonConstKey) {
        var imgIndex = Constants.DIR_IMG[dirCommonConstKey];

        if(this.dirImgIndex == imgIndex)
            return;

        this.dirImgIndex = imgIndex;
        this.sprite.setTexture(this.imageKeysArr[imgIndex]);
    }
}