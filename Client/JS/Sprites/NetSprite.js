// Basic unit that entirely posiitoned and directed by server calls

class NetSprite extends Sprite {

    id;
    moveSpeed = 4;
    isMoving = false;

    // Purely pixel based
    moveCache = [];

    moveDist = { x: 0, y: 0 };
    moveFracCovered = { x: 0, y: 0 };
    distToCover = { x: 0, y: 0 };

    constructor(scene, initGridPos, spritesheetKey, dirIndex, name, id, doDispName) {
        super(scene, initGridPos, spritesheetKey, dirIndex, name);

        this.id = id;

        // Populate the "from" slot with the initial position
        var initPixelPosPackage = {
            x: this.gameObjCont.x,
            y: this.gameObjCont.y,
            dir: dirIndex
        };

        this.moveCache[Consts.moveCacheSlots.FROM] = initPixelPosPackage;
        this.moveCache[Consts.moveCacheSlots.TO] = initPixelPosPackage;
        this.moveCache[Consts.moveCacheSlots.NEXT] = initPixelPosPackage;

        //* Until there would seem to be greater differences between a net "sprite" and net "player", just leave as one object with different toggles for now.
        if(doDispName) {
            // Anchor display name overhead
            var dispName = scene.add.text((this.sprite.width * 0.5), -(this.sprite.height * 0.5), name, Consts.DISP_NAME_STYLE);
            dispName.setOrigin(0.5);
            this.gameObjCont.add(dispName);
        }
    }

    ServerUpdate(updatePack) {

        this.isMoving = false;

        this.moveCache[Consts.moveCacheSlots.FROM] = this.moveCache[Consts.moveCacheSlots.TO];
        this.moveCache[Consts.moveCacheSlots.TO] = this.moveCache[Consts.moveCacheSlots.NEXT];
        this.moveCache[Consts.moveCacheSlots.NEXT] = updatePack;

        this.distToCover.x = Math.abs(this.moveCache[Consts.moveCacheSlots.TO].x - this.moveCache[Consts.moveCacheSlots.FROM].x);
        this.distToCover.y = Math.abs(this.moveCache[Consts.moveCacheSlots.TO].y - this.moveCache[Consts.moveCacheSlots.FROM].y);
        
        this.moveDist.x = 0;
        this.moveDist.y = 0;
        this.moveFracCovered.x = 0;
        this.moveFracCovered.y = 0;

        this.isMoving = true;

        this.ChangeDirection(this.moveCache[Consts.moveCacheSlots.TO].dir)
    }

    Update() {
        if(!this.isMoving) {
            this.gameObjCont.x = this.moveCache[Consts.moveCacheSlots.TO].x;
            this.gameObjCont.y = this.moveCache[Consts.moveCacheSlots.TO].y;
            return;
        }
        
        if (this.distToCover.x > 0 && this.moveFracCovered.x < 1.0) {
            this.moveDist.x += this.moveSpeed;
            this.moveFracCovered.x = this.moveDist.x / this.distToCover.x;
            this.gameObjCont.x = Phaser.Math.Linear(this.moveCache[Consts.moveCacheSlots.FROM].x, this.moveCache[Consts.moveCacheSlots.TO].x, this.moveFracCovered.x);
        }
        else {
            this.gameObjCont.x = this.moveCache[Consts.moveCacheSlots.TO].x;
        }

        if (this.distToCover.y > 0 && this.moveFracCovered.y < 1.0) {
            this.moveDist.y += this.moveSpeed;
            this.moveFracCovered.y = this.moveDist.y / this.distToCover.y;
            this.gameObjCont.y = Phaser.Math.Linear(this.moveCache[Consts.moveCacheSlots.FROM].y, this.moveCache[Consts.moveCacheSlots.TO].y, this.moveFracCovered.y);
        }
        else {
            this.gameObjCont.y = this.moveCache[Consts.moveCacheSlots.TO].y;
        }
    }
}