//* This class more about the actual Phaser player-character.

// TODO: Include some sort of scene state or type check: Tiled versus battle, different controls.
// Infact controls schemes should maybe be in different files, loaded to the player as the scene changes

// TODO: This no longer extends from NetSprite because they had so little in common. That being said,
// they do still have a few things in common, and should proably both extend from one class that extends from Sprite directly.
// "CharSprite" perhaps?

class LocalPlayer extends Sprite {

    moveSpeed = 4;
    isMoving = false;

    keys = null;
    keyHeld = 0;
    neighbors = { left: 0, right: 0, up: 0, down: 0 };
    
    canCacheNext = false;
    cacheNextAtPct = 0.9;

    moveCache_Grid = [];
    moveCache_Pixel = [];

    moveDist = 0.0;
    moveFracCovered = 0.0;

    moveRequestConfrmed;
    assessRequestConfirmed;

    elemFocusString = "";

    constructor(scene, initOrientation, spritesheetKey) {
        super(scene, { x: initOrientation.x, y: initOrientation.y }, spritesheetKey, initOrientation.dir, MainMenu.GetDispName());

        // Anchor display name overhead
        var dispName = scene.add.text((this.sprite.width * 0.5), -(this.sprite.height), MainMenu.GetDispName(), Consts.DISP_NAME_STYLE);
        dispName.setOrigin(0.5);
        this.gameObjCont.add(dispName);
        // TODO: Works for now, but is really not good. I need the depth of the display name to NOT be restriced by the parent container,
        // but that doesn't seem possible, so I'm just moving the whole container up, and the highest tile map layer even higher.
        this.gameObjCont.depth = Consts.depthExceptions.PLAYER_CONT;

        this.moveCache_Grid.push({
            x: initOrientation.x,
            y: initOrientation.y,
            dir: this.dirIndex
        });

        this.moveCache_Pixel.push({
            x: this.gameObjCont.x,
            y: this.gameObjCont.y,
            dir: this.dirIndex
        });

        this.moveRequestConfrmed = true;
        this.assessRequestConfirmed = true;

        var self = this;

        this.keys = {
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            enter: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
        };

        this.keys.left.on('down', () => self.keyHeld++);
        this.keys.left.on('up', StopMoveAnim);

        this.keys.right.on('down', () => self.keyHeld++);
        this.keys.right.on('up', StopMoveAnim);

        this.keys.up.on('down', () => self.keyHeld++);
        this.keys.up.on('up', StopMoveAnim);

        this.keys.down.on('down', () => self.keyHeld++);
        this.keys.down.on('up', StopMoveAnim);

        function StopMoveAnim() {
            self.keyHeld--;
            if(self.keyHeld <= 0)
                self.keyHeld = 0;
        }

        //* DEBUG vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
        Network.CreateResponse("RecCellValue", function (data) {
            if(isNaN(data.cellValue)) {
                var value = JSON.parse(JSON.stringify(data.cellValue));
                console.log(`From server, data at cell x: ${data.gridX}, y: ${data.gridY} is: `, value);
            }
            else {
                console.log(`From server, data at cell x: ${data.gridX}, y: ${data.gridY} is: ${data.cellValue}`);
            }
        });

        scene.input.keyboard.on('keydown_J', () => {
            console.log("cell value from client: " + self.neighbors.left);
            Network.Emit("ReqNeighborValue", { x: -1, y: 0 });
        });
        scene.input.keyboard.on('keydown_L', () => {
            console.log("cell value from client: " + self.neighbors.right);
            Network.Emit("ReqNeighborValue", { x: 1, y: 0 });
        });
        scene.input.keyboard.on('keydown_I', () => {
            console.log("cell value from client: " + self.neighbors.up);
            Network.Emit("ReqNeighborValue", { x: 0, y: -1 });
        });
        scene.input.keyboard.on('keydown_K', () => {
            console.log("cell value from client: " + self.neighbors.down);
            Network.Emit("ReqNeighborValue", { x: 0, y: 1 });
        });

        // TODO: Expand beyond debug, as game is more fully implemented.
        Main.game.canvas.addEventListener("click", (event) => {
            //* NOTE: Not debug, very important!
            self.elemFocusString = event.currentTarget.tagName;
            Main.game.input.keyboard.enabled = true;

            var posParent = Utility.html.ElemPos(event.currentTarget);
            var posX = event.clientX - posParent.x;
            var posY = event.clientY - posParent.y;

            var worldX = (self.scene.cameras.main.worldView.x * self.scene.cameras.main.zoom) + posX,
            worldY = (self.scene.cameras.main.worldView.y * self.scene.cameras.main.zoom) + posY;

            var cellX = (worldX - (worldX % self.scene.MapTileWidth_Zoomed)) / self.scene.MapTileWidth_Zoomed,
            cellY = (worldY - (worldY % self.scene.MapTileHeight_Zoomed)) / self.scene.MapTileHeight_Zoomed;

            // console.log(`canvas click event, posParent - x: ${posParent.x}, y: ${posParent.y}`);
            // console.log(`canvas click event, event.client - x: ${event.clientX}, y: ${event.clientY}`);
            // console.log(`canvas click event, camera worldView - x: ${self.scene.cameras.main.worldView.x * self.scene.cameras.main.zoom}, y: ${self.scene.cameras.main.worldView.y * self.scene.cameras.main.zoom}`);
            // console.log(`canvas click event, mouse pos - x: ${posX}, y: ${posY}`);
            // console.log(`canvas click event, camera to world - x: ${worldX}, y: ${worldY}`);
            // console.log(`canvas click event, worldX % self.scene.MapTile - x: ${worldX % self.scene.MapTileWidth_Zoomed}, y: ${worldY % self.scene.MapTileHeight_Zoomed}`);
            // console.log(`canvas click event, worldX - (worldX % self.scene.MapTile) - x: ${worldX - (worldX % self.scene.MapTileWidth_Zoomed)}, y: ${worldY - (worldY % self.scene.MapTileHeight_Zoomed)}`);
            // console.log(`canvas click event, as cells - x: ${cellX}, y: ${cellY}`);

            Network.Emit("ReqCellValue", { x: cellX, y: cellY });
        }, false);
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

            //console.log(self.moveCache_Pixel[self.moveCache_Pixel.length - 1]);
            self.moveRequestConfrmed = true;
            self.isMoving = true;
        });

        Network.CreateResponse("RecChangeDir", function (newDir) {
            self.moveRequestConfrmed = true;
            // Only if not actively moving anywhere, allow this change in direction.
            if(self.moveCache_Pixel.length == 1)
                self.ChangeDirection(newDir);
        });

        Network.CreateResponse("RecCellInteraction", function (data) {
            self.assessRequestConfirmed = true;
            //console.log(`From server, data at cell x: ${data.gridX}, y: ${data.gridY} is: `, data.cellValue);
            if(data.cellValue == Consts.tileTypes.SIGN) {
                //console.log(`Sign post reads: ${data.interactionObj.msg}`);
                Main.DispMessage(data.interactionObj.msg, 3);                
            }
            else if(data.cellValue == Consts.tileTypes.CHEST) {
                // TODO: If chest is closed and of lesser upgrade, get what's in it
                // TODO: Swap closed chest for open.
                
                console.log(`Chest type: ${data.interactionObj.chestType} hold upgrade: ${data.interactionObj.upgrade}`);             
            }
        });

        var elem_ChatLog = document.getElementById("ChatLog");
        Network.CreateResponse('RecChatLogUpdate', (data) => {
            var className = data.name == self.name ? "chatLogNameSelf" : "chatLogName";
            var htmlString = `<li><span class="${className}">${data.name}:</span> ${data.msg}</li>`;
            var node = Utility.html.FromString(htmlString);
            elem_ChatLog.appendChild(node);
            elem_ChatLog.scrollTop = elem_ChatLog.scrollHeight;
        });

        // CHAT MESSAGES - Send if button clicked OR if enter pressed while text field is focused.

        // TODO: Player speech bubbles would be cool, but overscoped for this right now.
        var elem_ChatTextInput = document.getElementById("PlayerChatMsg");
        elem_ChatTextInput.addEventListener('click', (event) => {
            self.elemFocusString = event.currentTarget.tagName;
            Main.game.input.keyboard.enabled = false;
        });
        // This is needed to compensate for the Phaser keyboard object being shut off when the input element is focused.
        elem_ChatTextInput.addEventListener('keyup', (event) => {
            if(event.keyCode === 13 && self.elemFocusString == "INPUT")
                SendMsgToServer();
        });
        function SendMsgToServer() {
            if(elem_ChatTextInput.value != "") {
                Network.Emit("ReqChatLogUpdate", { name: self.name, msg: elem_ChatTextInput.value });
                elem_ChatTextInput.value = "";
            }
        }
        document.getElementById("PlayerChatSendMsgBtn").addEventListener('click', SendMsgToServer);
        document.getElementById("PlayerChatViewBtn").addEventListener('click', () => {
            elem_ChatLog.classList.toggle('hide');
        });

        // Single-time key press, only repeats if held after about a second
        scene.input.keyboard.on('keydown_ENTER', () => {
            // Redundant check
            if(self.elemFocusString != "INPUT") {
                self.assessRequestConfirmed = false;
                Network.Emit("ReqCellInteraction", self.GetCellDiffByDir());
            }
        });
    }

    Update() {
        if(this.moveRequestConfrmed && this.elemFocusString != "INPUT") {
            // Check if we can move "to" a new cell, or cache the "next" one ahead
            if(this.moveCache_Grid.length <= Consts.moveCacheSlots.TO ||
                this.moveCache_Grid.length <= Consts.moveCacheSlots.NEXT && this.canCacheNext) {
                
                if(this.keys.left.isDown) {
                    this.moveRequestConfrmed = false;
                    if(this.neighbors.left == Consts.tileTypes.WALK) {
                        Network.Emit("ReqMoveToCell", { key: 'LEFT', cellDiff: { x: -1, y: 0 } });
                    }
                    else {
                        Network.Emit("ReqChangeDir", { key: 'LEFT' });
                    }
                }
                else if(this.keys.right.isDown) {
                    this.moveRequestConfrmed = false;
                    if(this.neighbors.right == Consts.tileTypes.WALK) {
                        Network.Emit("ReqMoveToCell", { key: 'RIGHT', cellDiff: { x: 1, y: 0 } });
                    }
                    else {
                        Network.Emit("ReqChangeDir", { key: 'RIGHT' });
                    }
                }
                else if(this.keys.up.isDown) {
                    this.moveRequestConfrmed = false;
                    if(this.neighbors.up == Consts.tileTypes.WALK) {
                        Network.Emit("ReqMoveToCell", { key: 'UP', cellDiff: { x: 0, y: -1 } });
                    }
                    else {
                        Network.Emit("ReqChangeDir", { key: 'UP' });
                    }   
                }
                else if(this.keys.down.isDown) {
                    this.moveRequestConfrmed = false;
                    if(this.neighbors.down == Consts.tileTypes.WALK) {
                        Network.Emit("ReqMoveToCell", { key: 'DOWN', cellDiff: { x: 0, y: 1 } });
                    }
                    else {
                        Network.Emit("ReqChangeDir", { key: 'DOWN' });
                    }
                }
            }
        }

        if(!this.isMoving) {
            if(this.keyHeld == 0) {
                this.Anim_Stop();
            }
            return;
        }

        // Change image direction upon committing to moving to the next cell
        if (this.moveFracCovered == 0.0) {
            this.ChangeDirection(this.moveCache_Pixel[Consts.moveCacheSlots.TO].dir);
        }

        this.moveDist += this.moveSpeed;
        // Presuming square tiles of course
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
        Network.Emit("UpdateOrientation", {
            x: this.gameObjCont.x,
            y: this.gameObjCont.y,
            dir: this.dirIndex
        });
    }

    GetCellDiffByDir() {
        if(this.dirIndex == Consts.dirImg.LEFT)
            return { x: -1, y: 0 };
        else if(this.dirIndex == Consts.dirImg.RIGHT)
            return { x: 1, y: 0 };
        else if(this.dirIndex == Consts.dirImg.UP)
            return { x: 0, y: -1 };
        else if(this.dirIndex == Consts.dirImg.DOWN)
            return { x: 0, y: 1 };
    }

    GetSavePack() {
        return {
            orientation: {
                x: this.moveCache_Grid[Consts.moveCacheSlots.FROM].x,
                y: this.moveCache_Grid[Consts.moveCacheSlots.FROM].y,
                dir: this.dirIndex
            }
        }
    }
}