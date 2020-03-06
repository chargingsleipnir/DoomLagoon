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
    isMoving = false;

    moveDist = 0.0;
    moveFracCovered = 0.0;

    // This will be used to allow the player to pre-select the next cell just a bit before landing at the cell they're actively moving towards.
    MOVE_CACHE_SLOTS = {
        from: 0,
        to: 1,
        next: 2
    }
    moveCache = [];
    canCacheNext = false;
    cacheNextAtPct = 0.9;

    constructor(scene, initGridPos) {
        super(scene, initGridPos, LocalPlayer.imageKeysArr, MainMenu.GetDispName(), Network.GetSocketID());

        var elem_ChatTextInput = document.getElementById("PlayerChatMsg");
        document.getElementById("PlayerChatSendMsgBtn").addEventListener('click', (e) => {
            console.log("Chat from player: " + elem_ChatTextInput.value);
            // TODO: send elem_ChatTextInput.value to some sort of chat system. (Player speach bubbles!)
            //* Such implementation should exist on NPC level
        });

        this.gridPos = { x: initGridPos.x, y: initGridPos.y };

        // Populate the "from" slot with the initial position
        this.moveCache.push({
            x: this.gameObjCont.x,
            y: this.gameObjCont.y,
            dirKey: ""
        });

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
    }

    static LoadImages(scene) {
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.LEFT], '../../Assets/Sprites/boatPH_Left.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.RIGHT], '../../Assets/Sprites/boatPH_Right.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.UP], '../../Assets/Sprites/boatPH_Up.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.DOWN], '../../Assets/Sprites/boatPH_Down.jpg');
    }

    AddToMoveCache(dirCommonConstKey) {
        var lastPosCached = this.moveCache[this.moveCache.length - 1];
        var dirNorm = Constants.DIR_MOVE[dirCommonConstKey];
        var nextPos = {
            x: lastPosCached.x + dirNorm.x * Constants.TILE_SIZE,
            y: lastPosCached.y + dirNorm.y * Constants.TILE_SIZE,
            dirKey: dirCommonConstKey
        };

        this.moveCache.push(nextPos);
        this.isMoving = true;
    }

    UpdateGridPos(pixelPos) {
        this.gridPos.x = pixelPos.x / Constants.TILE_SIZE;
        this.gridPos.y = pixelPos.y / Constants.TILE_SIZE;
    }

    Update() {

        // Check if we can move "to" a new cell, or cache the "next" one ahead
        if(this.moveCache.length <= this.MOVE_CACHE_SLOTS.to ||
            this.moveCache.length <= this.MOVE_CACHE_SLOTS.next && this.canCacheNext) {
            
            // TODO: Check neighbors as well for collisions
            if(this.keys.left.isDown) {
                this.AddToMoveCache('LEFT');
            }
            else if(this.keys.right.isDown) {
                this.AddToMoveCache('RIGHT');
            }
            else if(this.keys.up.isDown) {
                this.AddToMoveCache('UP');
            }
            else if(this.keys.down.isDown) {
                this.AddToMoveCache('DOWN');
            }
        }

        if(this.isMoving) {

            // Change image direction upon committing to moving to the next cell
            if (this.moveFracCovered == 0.0)
                this.ChangeDirection(this.moveCache[this.MOVE_CACHE_SLOTS.to].dirKey);

            this.moveDist += this.moveSpeed;
            this.moveFracCovered = this.moveDist / Constants.TILE_SIZE;

            // Still moving into cell, keep updating position
            if (this.moveFracCovered < 1.0) {
                this.gameObjCont.setPosition(
                    Phaser.Math.Linear(this.moveCache[this.MOVE_CACHE_SLOTS.from].x, this.moveCache[this.MOVE_CACHE_SLOTS.to].x, this.moveFracCovered),
                    Phaser.Math.Linear(this.moveCache[this.MOVE_CACHE_SLOTS.from].y, this.moveCache[this.MOVE_CACHE_SLOTS.to].y, this.moveFracCovered)
                );
                this.canCacheNext = this.moveFracCovered > this.cacheNextAtPct;
                //Network.Emit("UpdateMoveToServer", self.GetUpdatePack());
            }
            else {
                this.gameObjCont.setPosition(this.moveCache[this.MOVE_CACHE_SLOTS.to].x, this.moveCache[this.MOVE_CACHE_SLOTS.to].y);
                
                //Network.Emit("UpdateMoveToServer", self.GetUpdatePack());
                this.UpdateGridPos(this.moveCache[this.MOVE_CACHE_SLOTS.to]);

                this.moveDist = 0.0;
                this.moveFracCovered = 0.0;

                // Keep moving seemlessly to next position if one is identified
                this.moveCache.shift();
                this.isMoving = this.moveCache.length > this.MOVE_CACHE_SLOTS.to;
            }
        }
    }
}