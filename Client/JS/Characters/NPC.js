class NPC {

    gameObjCont;
    sprite;
    name;
    initPixelPos;
    imageKeysArr;

    directionImage;
    directionMove;

    //* imageKeysArr should be in order of left, right, up, and down, as consistent with constants.DIR_IMG
    constructor(scene, initGridPos, imageKeysArr, name) {
        this.initPixelPos = {
            x: initGridPos.x * Constants.TILE_SIZE,
            y: initGridPos.y * Constants.TILE_SIZE
        }

        this.imageKeysArr = imageKeysArr;

        this.gameObjCont = scene.add.container(this.initPixelPos.x, this.initPixelPos.y);
        
        // Start down just be default, could be anything
        this.directionImage = Constants.DIR_IMG.DOWN;
        this.sprite = scene.add.sprite(0, 0, imageKeysArr[this.directionImage]);
        
        this.gameObjCont.add(this.sprite);
        this.name = name || 'I am Error';
    }

    ChangeDirection(dirCommonConstKey) {
        this.ChangeDirectionMove(Constants.DIR_MOVE[dirCommonConstKey]);
        this.ChangeDirectionImage(Constants.DIR_IMG[dirCommonConstKey]);
    }
    ChangeDirectionMove(constDirMove) {
        this.directionMove = constDirMove;
    }
    ChangeDirectionImage(constDirImg) {
        this.directionImage = constDirImg;
        this.sprite.setTexture(this.imageKeysArr[constDirImg]);
    }
}