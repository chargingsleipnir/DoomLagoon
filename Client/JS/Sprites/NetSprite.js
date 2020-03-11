// Basic unit that entirely posiitoned and directed by server calls

class NetSprite extends Sprite {

    id;
    moveSpeed = 4;
    isMoving = false;

    moveDist = 0.0;
    moveFracCovered = 0.0;

    // This will be used to allow the player to pre-select the next cell just a bit before landing at the cell they're actively moving towards.
    moveCache_Grid = [];
    moveCache_Pixel = [];
    newMoveToggle;

    scene;

    constructor(scene, initGridPos, imageKeysArr, dirImgIndex, newMoveToggle, name, id, doDispName) {
        super(scene, initGridPos, imageKeysArr, dirImgIndex, name);

        this.newMoveToggle = newMoveToggle;

        this.id = id;
        this.scene = scene;

        // Populate the "from" slot with the initial position
        this.moveCache_Grid.push({
            x: initGridPos.x,
            y: initGridPos.y,
            dir: dirImgIndex
        });
        this.moveCache_Pixel.push({
            x: this.gameObjCont.x,
            y: this.gameObjCont.y,
            dir: dirImgIndex
        });

        //* Until there would seem to be greater differences between a net "sprite" and net "player", just leave as one object with different toggles for now.
        if(doDispName) {
            // Anchor display name overhead
            var dispName = scene.add.text((this.sprite.width * 0.5), -(this.sprite.height * 0.5), name, Consts.DISP_NAME_STYLE);
            dispName.setOrigin(0.5);
            this.gameObjCont.add(dispName);
        }
    }

    ServerUpdate(updatePack) {
        if(updatePack.toggle == this.newMoveToggle)
            return;

        this.newMoveToggle = updatePack.toggle

        this.isMoving = false;

        // For straight-made NetSprites, there's no real need to track the grid positions, just convert straight to pixel positions
        updatePack.x *= this.scene.MapTileWidth;
        updatePack.y *= this.scene.MapTileHeight;

        // Toggle check is no longer needed.
        delete updatePack.toggle;
        this.moveCache_Pixel.push(updatePack);

        this.isMoving = this.moveCache_Pixel.length > Consts.moveCacheSlots.TO;
    }

    Update() {
        if(!this.isMoving)
            return;

        // Change image direction upon committing to moving to the next cell
        if (this.moveFracCovered == 0.0)
            this.ChangeDirection(this.moveCache_Pixel[Consts.moveCacheSlots.TO].dir);

        this.moveDist += this.moveSpeed;
        // Presuming sqaure tiles of course
        this.moveFracCovered = this.moveDist / this.scene.MapTileWidth;

        // Still moving into cell, keep updating position
        if (this.moveFracCovered < 1.0) {
            this.gameObjCont.setPosition(
                Phaser.Math.Linear(this.moveCache_Pixel[Consts.moveCacheSlots.FROM].x, this.moveCache_Pixel[Consts.moveCacheSlots.TO].x, this.moveFracCovered),
                Phaser.Math.Linear(this.moveCache_Pixel[Consts.moveCacheSlots.FROM].y, this.moveCache_Pixel[Consts.moveCacheSlots.TO].y, this.moveFracCovered)
            );
            this.canCacheNext = this.moveFracCovered > this.cacheNextAtPct;
        }
        else {
            this.gameObjCont.setPosition(this.moveCache_Pixel[Consts.moveCacheSlots.TO].x, this.moveCache_Pixel[Consts.moveCacheSlots.TO].y);

            this.moveDist = 0.0;
            this.moveFracCovered = 0.0;

            // Keep moving seemlessly to next position if one is identified
            this.moveCache_Grid.shift();
            this.moveCache_Pixel.shift();

            this.isMoving = this.moveCache_Pixel.length > Consts.moveCacheSlots.TO;
        }
    }
}