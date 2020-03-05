class NetPlayer extends NPC {

    // TODO: Different "name" functionality in that these will always be displayed over the character's heads
    // NPC names will display at other times, but not on the overworld

    constructor(scene, initGridPos, imageKeysArr, name, id) {
        super(scene, initGridPos, imageKeysArr, name);

        // Anchor display name overhead
        var dispName = scene.add.text(-(this.sprite.width * 0.5), -Constants.TILE_SIZE - 4, name, Constants.DISP_NAME_STYLE);
        this.gameObjCont.add(dispName);
    }
}