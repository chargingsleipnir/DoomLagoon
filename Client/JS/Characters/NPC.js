class NPC {

    gameObjCont;
    sprite;
    name;
    initPixelPos;

    constructor(initGridPos, image, name) {
        this.initPixelPos = {
            x: initGridPos.x * Constants.TILE_SIZE,
            y: initGridPos.y * Constants.TILE_SIZE
        }

        //console.log(Main.activeScene);
        this.gameObjCont = Main.activeScene.add.container(this.initPixelPos.x, this.initPixelPos.y);
        
        this.sprite = Main.activeScene.add.sprite(0, 0, image);
        this.gameObjCont.add(this.sprite);
        this.name = name || 'I am Error';
    }
}