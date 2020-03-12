//* This class more about the actual Phaser player-character. See "User" for game prefs & meta info.

// TODO: Include some sort of scene state or type check: Tiled versus battle, different controls.
// Infact controls schemes should maybe be in different files, loaded to the player as the scene changes

// TODO: This no longer extends from NetSprite because they had so little in common. That being said,
// they do still have a few things in common, and should proably both extend from one class that extends from Sprite directly.
// "CharSprite" perhaps?

class LocalPlayer extends Sprite {

    moveSpeed = 4;
    isMoving = false;

    keys = null;
    neighbors = { left: 0, right: 0, up: 0, down: 0 };
    
    canCacheNext = false;
    cacheNextAtPct = 0.9;

    moveCache_Grid = [];
    moveCache_Pixel = [];

    moveDist = 0.0;
    moveFracCovered = 0.0;

    constructor(scene, initGridPos, imageKeysArr) {
        super(scene, initGridPos, imageKeysArr, Consts.dirImg.DOWN, MainMenu.GetDispName());

        // Anchor display name overhead
        var dispName = scene.add.text((this.sprite.width * 0.5), -(this.sprite.height * 0.5), MainMenu.GetDispName(), Consts.DISP_NAME_STYLE);
        dispName.setOrigin(0.5);
        this.gameObjCont.add(dispName);

        this.moveCache_Grid.push({
            x: initGridPos.x,
            y: initGridPos.y,
            dir: this.dirImgIndex
        });

        this.moveCache_Pixel.push({
            x: this.gameObjCont.x,
            y: this.gameObjCont.y,
            dir: this.dirImgIndex
        });

        var elem_ChatTextInput = document.getElementById("PlayerChatMsg");
        document.getElementById("PlayerChatSendMsgBtn").addEventListener('click', (e) => {
            console.log("Chat from player: " + elem_ChatTextInput.value);
            // TODO: send elem_ChatTextInput.value to some sort of chat system. (Player speach bubbles!)
            //* Such implementation should exist on higher inheritance level
        });

        this.keys = {
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        };

        var self = this;

        //* DEBUG vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
        Network.CreateResponse("RecCellValue", function (data) {
            console.log(`From server, data at cell x: ${data.gridX}, y: ${data.gridY} is: ${data.cellValue}`);
        });

        scene.input.keyboard.on('keydown_J', () => {
            console.log("cell value from client: " + self.neighbors.left);
            Network.Emit("ReqCellValue", { x: -1, y: 0 });
        });
        scene.input.keyboard.on('keydown_L', () => {
            console.log("cell value from client: " + self.neighbors.right);
            Network.Emit("ReqCellValue", { x: 1, y: 0 });
        });
        scene.input.keyboard.on('keydown_I', () => {
            console.log("cell value from client: " + self.neighbors.up);
            Network.Emit("ReqCellValue", { x: 0, y: -1 });
        });
        scene.input.keyboard.on('keydown_K', () => {
            console.log("cell value from client: " + self.neighbors.down);
            Network.Emit("ReqCellValue", { x: 0, y: 1 });
        });
        //* DEBUG ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^


        Network.CreateResponse('RecUpdateNeighbor', (data) => {
            self.neighbors[data.side] = data.occupancy;
        });
        Network.CreateResponse('RecUpdateNeighbors', (data) => {
            self.neighbors = data.neighbors;
        });


        Network.CreateResponse("RecMoveToCell", function (newMoveData) {
            self.moveCache_Grid.push(newMoveData);
            self.moveCache_Pixel.push({
                x: newMoveData.x * self.scene.MapTileWidth,
                y: newMoveData.y * self.scene.MapTileHeight,
                dir: newMoveData.dir
            });
    
            self.isMoving = true;
        });
    }

    Update() {
        // Check if we can move "to" a new cell, or cache the "next" one ahead
        if(this.moveCache_Grid.length <= Consts.moveCacheSlots.TO ||
            this.moveCache_Grid.length <= Consts.moveCacheSlots.NEXT && this.canCacheNext) {
            
            if(this.keys.left.isDown && this.neighbors.left == 0) {
                Network.Emit("ReqMoveToCell", {
                    key: 'LEFT',
                    cellDiff: { x: -1, y: 0 }
                });
            }
            else if(this.keys.right.isDown && this.neighbors.right == 0) {
                Network.Emit("ReqMoveToCell", {
                    key: 'RIGHT',
                    cellDiff: { x: 1, y: 0 }
                });
            }
            else if(this.keys.up.isDown && this.neighbors.up == 0) {
                Network.Emit("ReqMoveToCell", {
                    key: 'UP',
                    cellDiff: { x: 0, y: -1 }
                });
            }
            else if(this.keys.down.isDown && this.neighbors.down == 0) {
                Network.Emit("ReqMoveToCell", {
                    key: 'DOWN',
                    cellDiff: { x: 0, y: 1 }
                });
            }
        }

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
        Network.Emit("UpdatePixelPos", {
            x: this.gameObjCont.x,
            y: this.gameObjCont.y,
            dir: this.dirImgIndex
        });
    }
}