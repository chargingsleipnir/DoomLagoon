//* This class more about the actual Phaser player-character. See "User" for game prefs & meta info.

class LocalPlayer extends NetPlayer {

    static elem_ChatSendBtn;

    static imageKeysArr = [
        'navBoatLeft',
        'navBoatRight',
        'navBoatUp',
        'navBoatDown'
    ];

    // All I need to know about anyone other that the player is their pixel position. The server should handle the rest.
    gridPos;

    keys = null;
    neighbors = { left: 0, right: 0, up: 0, down: 0 };

    moveSpeed = 4;
    isMoving;
    nextCell = { x: 0, y: 0 }

    moveDist = 0.0;
    moveFracCovered = 0.0;
    moveCache = { 
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 }
    };

    constructor(scene, initGridPos) {
        super(scene, initGridPos, LocalPlayer.imageKeysArr, MainMenu.GetDispName(), Network.GetSocketID());

        var elem_ChatTextInput = document.getElementById("PlayerChatMsg");
        document.getElementById("PlayerChatSendMsgBtn").addEventListener('click', (e) => {
            console.log("Chat from player: " + elem_ChatTextInput.value);
            // TODO: send elem_ChatTextInput.value to some sort of chat system. (Player speach bubbles!)
            //* Such implementation should exist on NPC level
        });

        this.gridPos = { x: initGridPos.x, y: initGridPos.y };

        this.keys = {
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        };

        //* DEBUG vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
        Network.CreateResponse("RecCellValue", function (value) {
            console.log("cell value from server: " + value);
        });

        scene.input.keyboard.on('keydown_J', () => {
            console.log("cell value from client: " + this.neighbors.left);
            Network.Emit("ReqCellValue", { x: this.gridPos.x - 1, y: this.gridPos.y });
        });
        scene.input.keyboard.on('keydown_L', () => {
            console.log("cell value from client: " + this.neighbors.right);
            Network.Emit("ReqCellValue", { x: this.gridPos.x + 1, y: this.gridPos.y });
        });
        scene.input.keyboard.on('keydown_I', () => {
            console.log("cell value from client: " + this.neighbors.up);
            Network.Emit("ReqCellValue", { x: this.gridPos.x, y: this.gridPos.y - 1 });
        });
        scene.input.keyboard.on('keydown_K', () => {
            console.log("cell value from client: " + this.neighbors.down);
            Network.Emit("ReqCellValue", { x: this.gridPos.x, y: this.gridPos.y + 1 });
        });
        //* DEBUG ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        this.isMoving = false;
    }

    static LoadImages(scene) {
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.LEFT], '../../Assets/Sprites/boatPH_Left.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.RIGHT], '../../Assets/Sprites/boatPH_Right.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.UP], '../../Assets/Sprites/boatPH_Up.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.DOWN], '../../Assets/Sprites/boatPH_Down.jpg');
    }

    MoveToPoint (cell, dirCommonConstKey) {
        this.ChangeDirection(dirCommonConstKey);
        
        this.isMoving = true;
        // Set data for move
        this.moveCache.start.x = this.gameObjCont.x;
        this.moveCache.start.y = this.gameObjCont.y;
        this.moveCache.end.x = cell.x * Constants.TILE_SIZE;
        this.moveCache.end.y = cell.y * Constants.TILE_SIZE;
    };

    MoveOnGrid (dirCommonConstKey) {
        this.nextCell.x = this.gridPos.x + Constants.DIR_MOVE[dirCommonConstKey].x;
        this.nextCell.y = this.gridPos.y + Constants.DIR_MOVE[dirCommonConstKey].y;
        this.MoveToPoint(this.nextCell, dirCommonConstKey);
    }

    UpdateGridPos(pixelPos) {
        this.gridPos.x = pixelPos.x / Constants.TILE_SIZE;
        this.gridPos.y = pixelPos.y / Constants.TILE_SIZE;
    }

    Update() {

        if(!this.isMoving) {
            // TODO: Check neighbors as well for collisions
            if(this.keys.left.isDown) {
                this.MoveOnGrid('LEFT');
            }
            else if(this.keys.right.isDown) {
                this.MoveOnGrid('RIGHT');
            }
            else if(this.keys.up.isDown) {
                this.MoveOnGrid('UP');
            }
            else if(this.keys.down.isDown) {
                this.MoveOnGrid('DOWN');
            }
        }
        else {
            this.moveDist += this.moveSpeed;
            this.moveFracCovered = this.moveDist / Constants.TILE_SIZE;

            // Still moving into cell, keep updating position
            if (this.moveFracCovered < 1.0) {
                this.gameObjCont.setPosition(
                    Phaser.Math.Linear(this.moveCache.start.x, this.moveCache.end.x, this.moveFracCovered),
                    Phaser.Math.Linear(this.moveCache.start.y, this.moveCache.end.y, this.moveFracCovered)
                );
                //Network.Emit("UpdateMoveToServer", self.GetUpdatePack());
            }
            else {
                this.isMoving = false;
                this.gameObjCont.setPosition(this.moveCache.end.x, this.moveCache.end.y);
                
                //Network.Emit("UpdateMoveToServer", self.GetUpdatePack());
                this.UpdateGridPos(this.moveCache.end);

                this.moveDist = 0.0;
                this.moveFracCovered = 0.0;
            }
        }
    }
}