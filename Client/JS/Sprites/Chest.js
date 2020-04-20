class Chest {

    constructor(scene, sprite) {
        this.scene = scene;
        this.chestSprite = sprite;

        this.gameObjCont = scene.add.container(this.chestSprite.x, this.chestSprite.y);
        this.gameObjCont.depth = Consts.depthExceptions.TILEMAP_OVERLAP_LAYER;

        this.chestSprite.setPosition(0, 0);
        this.gameObjCont.add(this.chestSprite);

        this.textureOpen = "";
        this.textureClosed = "";

        this.contentSprites = [];
        this.contentBG = scene.add.graphics();
        this.gameObjCont.add(this.contentBG);

        this.contentBG.fillStyle(0xFFFFFF, Consts.CHEST_CONT_BG_ALPHA);
        this.contentBG.alpha = 0;
    }

    //* Object locations seem to be placed by their centre-points here, rather than their bottom-left corner as is the case when reading the raw data.
    GetIntCoord(tileWidth, tileHeight, mapSize) {
        var moddedX = this.gameObjCont.x - (this.chestSprite.width * 0.5);
        var moddedY = this.gameObjCont.y - (this.chestSprite.height * 0.5);
        return SuppFuncs.CoordsToInt(moddedX / tileWidth, moddedY / tileHeight, mapSize);
    }

    AddTextures(texClosed, texOpen) {
        this.textureClosed = texClosed;
        this.textureOpen = texOpen;

        this.chestSprite.setTexture(texClosed, 0);
    }

    AddContents(imgArr) {
        var maxBoxWidth = Consts.CHEST_CONT_PADDING;
        for(let i = 0; i < imgArr.length; i++) {
            this.contentSprites.push(this.scene.add.image(0, 0, imgArr[i]));
            this.contentSprites[i].setOrigin(0, 1);
            this.contentSprites[i].alpha = 0;

            maxBoxWidth += this.contentSprites[i].width;
            maxBoxWidth += Consts.CHEST_CONT_PADDING;

            this.gameObjCont.add(this.contentSprites[i]);
        }

        for(let i = 0; i < this.contentSprites.length; i++) {
            this.contentSprites[i].setPosition(
                (-maxBoxWidth * 0.5) + (Consts.CHEST_CONT_PADDING * (i+1)) + (this.contentSprites[i].width * i),
                -(Consts.CHEST_CONT_Y_GAP + Consts.CHEST_CONT_PADDING)
            );
        }

        this.contentBG.fillRect(-maxBoxWidth * 0.5, -Consts.CHEST_CONT_Y_GAP, maxBoxWidth, -(this.contentSprites[0].height + (Consts.CHEST_CONT_PADDING * 2)));
    }

    ShowContents() {
        const showBGConfig = { ease: 'Linear', from: 0, start: 0, to: Consts.CHEST_CONT_BG_ALPHA };
        this.scene.tweens.add({
            duration: 250,
            alpha: showBGConfig,
            targets: this.contentBG
        });
        const showContentsConfig = { ease: 'Linear', from: 0, start: 0, to: 1 };
        this.scene.tweens.add({
            duration: 250,
            alpha: showContentsConfig,
            targets: this.contentSprites
        });
        setTimeout(() => { this.HideContents(); }, 5000);
    }
    HideContents() {
        const hideBGConfig = { ease: 'Linear', from: Consts.CHEST_CONT_BG_ALPHA, start: Consts.CHEST_CONT_BG_ALPHA, to: 0 };
        this.scene.tweens.add({
            duration: 250,
            alpha: hideBGConfig,
            targets: this.contentBG
        });
        const hideContentsConfig = { ease: 'Linear', from: 1, start: 1, to: 0 };
        this.scene.tweens.add({
            duration: 250,
            alpha: hideContentsConfig,
            targets: this.contentSprites
        });
    }
    Open() {
        this.chestSprite.setTexture(this.textureOpen, 0);
        this.ShowContents();
    }
    Close() {
        this.chestSprite.setTexture(this.textureClosed, 0);
    }
}