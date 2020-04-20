//* This class more about the actual Phaser player-character.

// TODO: Include some sort of scene state or type check: Tiled versus battle, different controls.
// Infact controls schemes should maybe be in different files, loaded to the player as the scene changes

// TODO: This no longer extends from NetSprite because they had so little in common. That being said,
// they do still have a few things in common, and should proably both extend from one class that extends from Sprite directly.
// "CharSprite" perhaps?

class LocalPlayer extends Sprite {

    constructor(scene, serverData) {
        super(scene, { x: serverData.orientation.x, y: serverData.orientation.y }, serverData.assetKey, serverData.orientation.dir, MainMenu.GetDispName());

        this.keyHeld = 0;
        this.neighbors = { LEFT: 0, RIGHT: 0, UP: 0, DOWN: 0 };
        
        this.canCacheNext = false;

        this.moveCache_Grid = [];
        this.moveCache_Pixel = [];

        this.moveDist = 0.0;
        this.moveFracCovered = 0.0;

        this.moveRequestConfrmed = true;
        this.assessRequestConfirmed = true;

        this.inBattle = false;


        // Anchor display name overhead
        var dispName = scene.add.text((this.sprite.width * 0.5), -(this.sprite.height), MainMenu.GetDispName(), Consts.STYLE_DISP_NAME);
        dispName.setOrigin(0.5);
        this.gameObjCont.add(dispName);
        // TODO: Works for now, but is really not good. I need the depth of the display name to NOT be restriced by the parent container,
        // but that doesn't seem possible, so I'm just moving the whole container up, and the highest tile map layer even higher.

        this.moveCache_Grid.push({
            x: serverData.orientation.x,
            y: serverData.orientation.y,
            dir: this.dirIndex
        });

        this.moveCache_Pixel.push({
            x: this.gameObjCont.x,
            y: this.gameObjCont.y,
            dir: this.dirIndex
        });

        this.upgrades = {
            equip: serverData.upgrades.equip,
            ability: serverData.upgrades.ability
        };

        this.keys = {
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            enter: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
        };

        this.keys.left.on('down', () => this.keyHeld++);
        this.keys.left.on('up', StopMoveAnim);

        this.keys.right.on('down', () => this.keyHeld++);
        this.keys.right.on('up', StopMoveAnim);

        this.keys.up.on('down', () => this.keyHeld++);
        this.keys.up.on('up', StopMoveAnim);

        this.keys.down.on('down', () => this.keyHeld++);
        this.keys.down.on('up', StopMoveAnim);

        var self = this;
        function StopMoveAnim() {
            self.keyHeld--;
            if(self.keyHeld <= 0)
                self.keyHeld = 0;
        }

        //* DEBUG vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
        scene.input.keyboard.on('keydown_J', () => {
            console.log("cell value from client: " + self.neighbors.LEFT);
            Network.Emit("ReqNeighborValue", { x: -1, y: 0 });
        });
        scene.input.keyboard.on('keydown_L', () => {
            console.log("cell value from client: " + self.neighbors.RIGHT);
            Network.Emit("ReqNeighborValue", { x: 1, y: 0 });
        });
        scene.input.keyboard.on('keydown_I', () => {
            console.log("cell value from client: " + self.neighbors.UP);
            Network.Emit("ReqNeighborValue", { x: 0, y: -1 });
        });
        scene.input.keyboard.on('keydown_K', () => {
            console.log("cell value from client: " + self.neighbors.DOWN);
            Network.Emit("ReqNeighborValue", { x: 0, y: 1 });
        });
        //* DEBUG ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        // Single-time key press, only repeats if held after about a second
        scene.input.keyboard.on('keydown_ENTER', () => {
            // Redundant check
            if(InGameGUI.CheckCanvasFocus()) {
                self.assessRequestConfirmed = false;
                Network.Emit("ReqCellInteraction", self.GetCellDiffByDir());
            }
        });

        Network.CreateResponse('RecUpdateNeighbor', (data) => {
            self.neighbors[data.side] = data.occupancy;
            self.inBattle = data.inBattle;
        });
        Network.CreateResponse('RecUpdateNeighbors', (data) => {
            self.neighbors = data.neighbors;
            self.inBattle = data.inBattle;
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
                Main.DispMessage(data.interactionObj.msg, 3);
            }
            else if(data.cellValue == Consts.tileTypes.CHEST) {
                // Chest already open.
                if(data.interactionObj == null) {
                    console.log(`This chest is currently empty, will fill back up soon.`);
                    return;
                }
                
                // Display message no matter what, covers non-upgrades
                Main.DispMessage(data.interactionObj.upgradeMsg, 3);
                if(!data.interactionObj.wasUpgraded)
                    return;

                console.log(`Chest type: ${data.interactionObj.contents.chestType} holds upgrade: ${data.interactionObj.contents.upgrade}`);
                if(data.interactionObj.contents.chestType == Consts.chestTypes.EQUIPMENT) {
                    self.upgrades.equip = data.interactionObj.contents.upgrade;
                    self.UpdateTexture(data.interactionObj.updatedAssetKey);
                }
                else {
                    self.upgrades.ability = data.interactionObj.contents.upgrade;
                }
                
                GameAudio.SFXPlay("chest");
                Main.Save();
            }
            if(data.cellValue == Consts.tileTypes.SPRING) {
                Main.DispMessage(data.interactionObj.msg, 3);
                GameAudio.SFXPlay("spring");
            }
        });

        // Since local player is made AFTER servr player, these Network responses were not created when my map positioning was set.
        // Get a local update of my neighbors.
        Network.Emit("ReqNeighborUpdate");
    }

    Update() {
        this.gameObjCont.depth = this.gameObjCont.y;

        //console.log("================================================");
        //console.log(this.moveRequestConfrmed);
        //console.log(this.inBattle);
        if(this.moveRequestConfrmed && !this.inBattle && InGameGUI.CheckCanvasFocus()) {
            // Check if we can move "to" a new cell, or cache the "next" one ahead
            //console.log(this.moveCache_Grid.length <= Consts.moveCacheSlots.TO);
            if(this.moveCache_Grid.length <= Consts.moveCacheSlots.TO ||
                this.moveCache_Grid.length <= Consts.moveCacheSlots.NEXT && this.canCacheNext) {
                this.canCacheNext = false;
                
                //console.log(this.keys.left.isDown);
                if(this.keys.left.isDown) {
                    //console.log(this.neighbors.LEFT);
                    this.moveRequestConfrmed = false;
                    if(this.neighbors.LEFT == Consts.tileTypes.WALK) {
                        //console.log("Walking left");
                        Network.Emit("ReqMoveToCell", Consts.dirDiff[Consts.dirIndex.LEFT]);
                    }
                    else {
                        Network.Emit("ReqChangeDir", { key: 'LEFT' });
                    }
                }
                else if(this.keys.right.isDown) {
                    this.moveRequestConfrmed = false;
                    if(this.neighbors.RIGHT == Consts.tileTypes.WALK) {
                        Network.Emit("ReqMoveToCell", Consts.dirDiff[Consts.dirIndex.RIGHT]);
                    }
                    else {
                        Network.Emit("ReqChangeDir", { key: 'RIGHT' });
                    }
                }
                else if(this.keys.up.isDown) {
                    this.moveRequestConfrmed = false;
                    if(this.neighbors.UP == Consts.tileTypes.WALK) {
                        Network.Emit("ReqMoveToCell", Consts.dirDiff[Consts.dirIndex.UP]);
                    }
                    else {
                        Network.Emit("ReqChangeDir", { key: 'UP' });
                    }   
                }
                else if(this.keys.down.isDown) {
                    this.moveRequestConfrmed = false;
                    if(this.neighbors.DOWN == Consts.tileTypes.WALK) {
                        Network.Emit("ReqMoveToCell", Consts.dirDiff[Consts.dirIndex.DOWN]);
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

        this.moveDist += Consts.MAP_MOVE_SPEED;
        // Presuming square tiles of course
        this.moveFracCovered = this.moveDist / this.scene.MapTileWidth;

        // Still moving into cell, keep updating position
        if (this.moveFracCovered < 1.0) {
            this.gameObjCont.setPosition(
                Phaser.Math.Linear(this.moveCache_Pixel[Consts.moveCacheSlots.FROM].x, this.moveCache_Pixel[Consts.moveCacheSlots.TO].x, this.moveFracCovered),
                Phaser.Math.Linear(this.moveCache_Pixel[Consts.moveCacheSlots.FROM].y, this.moveCache_Pixel[Consts.moveCacheSlots.TO].y, this.moveFracCovered)
            );
            this.canCacheNext = this.moveFracCovered > Consts.CACHE_NEXT_MOVE_PCT;
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
        if(this.dirIndex == Consts.dirIndex.LEFT)
            return { x: -1, y: 0 };
        else if(this.dirIndex == Consts.dirIndex.RIGHT)
            return { x: 1, y: 0 };
        else if(this.dirIndex == Consts.dirIndex.UP)
            return { x: 0, y: -1 };
        else if(this.dirIndex == Consts.dirIndex.DOWN)
            return { x: 0, y: 1 };
    }

    GetSavePack() {
        return {
            orientation: {
                x: this.moveCache_Grid[Consts.moveCacheSlots.FROM].x,
                y: this.moveCache_Grid[Consts.moveCacheSlots.FROM].y,
                dir: this.dirIndex
            },
            upgrades: {
                equip: this.upgrades.equip,
                ability: this.upgrades.ability
            }
        }
    }
}