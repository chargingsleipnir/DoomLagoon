//var entity = require('./Entity.js')();

var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

// var obj = {
//     a: 5,
//     b: "test"
// };

// var arr = [];
// arr.push({
//     a: 5,
//     b: "test"
// });

// var cont = {};
// cont['slot'] = arr[0];

// delete cont['slot'];

// console.log(arr[0]);
// console.log(cont['slot']);

module.exports = function(sprites) {

    const entityModule = require('./Entity.js')(sprites);

    // Since I'll only be reusing a small amount of enemies, less than 100, this is as much as I need to do for their ids
    var enemyID = 100;

    class Enemy extends entityModule.Entity {
        type = -1;
        spawnPos;
        pixelPosActive;
        pixelPosFrom;
        pixelPosTo;

        isMoving;
        moveDist;
        moveFracCovered;
        MOVE_COOLDOWN = 2;

        strength;
        // Going to maintain this as always full list of nulls and/or socketIDs so I can use the indices to send to the clients to match their locations.
        playerSocketIDs;
        playerBattleCount;
        isAlive;

        io;
        timeoutRef;

        constructor(enemySpawnObj) {
            enemySpawnObj.id = enemyID;
            enemyID++;
            // Not set in Tiled - no real need to be
            enemySpawnObj.dir = Consts.dirIndex.DOWN;

            // Add the sub-typing into the cell data to reach the Client
            var enemyType = enemySpawnObj.props['enemyType'];
            enemySpawnObj.cellData = { 
                spriteType: Consts.spriteTypes.ENEMY,
                id: enemySpawnObj.id,
                enemyType: !isNaN(enemyType) ? enemyType : null
            };

            if(enemySpawnObj.cellData.enemyType == null)
                console.error("Some Enemy not given an enemy type in Tiled");

            super(enemySpawnObj);

            this.type = enemyType;
            this.spawnPos = {
                x: this.gridPos.x,
                y: this.gridPos.y
            };
            
            this.ResetPosData();

            this.playerSocketIDs = [];
            this.playerBattleCount = 0;
            for(let i = 0; i < Consts.MAX_PLAYERS_PER_BATTLE; i++) {
                this.playerSocketIDs.push(null);
            }

            this.isAlive = true;

            //* This might be more than sufficient to distinguish among each type of enemy for such a limited game sample
            // TODO: If not, Give each enemy type it's own class, "extended" from an "Enemy" base class, With "Enemy Factory" a separate thing (file or class) that creates the derived classes based on the map data.
            switch(this.type) {
                case Consts.enemyTypes.KNIGHT_AXE_RED:
                    this.name = "KnightAxeRed";
                    this.hpCurr = this.hpMax = 10;
                    this.strength = 3;
                    break;
            }
        }

        SetIoObj(io) {
            this.io = io;
        }

        Init() {
            super.Init();
            this.RunMoveTimer();
        }

        ResetPosData() {
            this.pixelPosActive = {
                x: this.gridPos.x * mapData.GetTileWidth(),
                y: this.gridPos.y * mapData.GetTileHeight(),
            }
            
            this.pixelPosFrom = { x: -1, y: -1 };
            this.pixelPosTo = { x: -1, y: -1 };

            this.isMoving = false;
            this.moveDist = 0;
            this.moveFracCovered = 0;
        }

        //* Gets called from Entity MoveToCell, upon RunMoveTimer's new position selection, so this is the perfect - if not entirely appropriate - place to update the next pixel-based coordinates
        UpdateMove(newPos, dir) {
            super.UpdateMove(newPos, dir);
            this.pixelPosTo.x = newPos.x * mapData.GetTileWidth();
            this.pixelPosTo.y = newPos.y * mapData.GetTileHeight();
        };

        GetUpdatePack() {
            return {
                x: this.pixelPosActive.x,
                y: this.pixelPosActive.y,
                dir: this.dir
            };
        }

        CanAddPlayerToBattle() {
            return this.playerBattleCount < Consts.MAX_PLAYERS_PER_BATTLE;
        }

        AddPlayerToBattle(socketID) {
            var playerIdxObj = {
                self: -1,
                others: []
            };

            if(this.CanAddPlayerToBattle()) {
                //console.log(`Socket ID pushed into battle group: ${socketID}`);
                for(let i = 0; i < Consts.MAX_PLAYERS_PER_BATTLE; i++) {
                    if(this.playerSocketIDs[i] == null) {
                        if(playerIdxObj.self > -1)
                            continue;

                        this.playerSocketIDs[i] = socketID;
                        playerIdxObj.self = i;
                        this.playerBattleCount++;

                        // Let all other active battle participants know to add this player
                        for(let j = 0; j < Consts.MAX_PLAYERS_PER_BATTLE; j++) {
                            if(j == i)
                                continue;

                            if(this.playerSocketIDs[j] != null)
                                this.io.to(this.playerSocketIDs[j]).emit('RecAddPlayer', i);
                        }
                    }
                    else {
                        playerIdxObj.others.push(i);
                    }
                }
            }
            this.inBattle = this.playerBattleCount > 0;
            if(this.inBattle)
                clearTimeout(this.timeoutRef);

            return playerIdxObj;
        }

        RemovePlayerFromBattle(socketID) {
            if(this.playerBattleCount > 0) {
                var idx = this.playerSocketIDs.indexOf(socketID);
                if(idx > -1) {
                    this.playerSocketIDs[idx] = null;
                    this.playerBattleCount--;
                    //console.log(`Removed player ${socketID}`);
                    //console.log(`Players remaining in list ${this.playerBattleCount}`);

                    this.inBattle = this.playerBattleCount > 0;
                    if(this.CanMoveOnMap()) {
                        this.hpCurr = this.hpMax;
                        this.RunMoveTimer();
                    }
                    // If still in battle, let every other player know of the one that left
                    else {
                        for(let i = 0; i < Consts.MAX_PLAYERS_PER_BATTLE; i++) {
                            if(this.playerSocketIDs[i] != null)
                                this.io.to(this.playerSocketIDs[i]).emit('RecLosePlayer', idx);
                        }
                    }
                }
            }
        }

        Enact(actionObj) {
            // This is necessary to be able to emit a signal to all battle members after they are removed from the battle and their socketID is lost
            var socketIDListCopy = [];
            for(var i = this.playerSocketIDs.length - 1; i > -1; i--) {
                socketIDListCopy.push(this.playerSocketIDs[i]);
            }

            if(actionObj.command == Consts.battleCommands.FIGHT) {
                this.hpCurr -= actionObj.damage;
                if(this.hpCurr <= 0) {
                    this.hpCurr = 0;
                    this.isAlive = false;
                    this.inBattle = false;
                    // Deactivate self from map
                    this.RemoveSelf();
    
                    // Reset back to spawn position and wait for it to be clear before reviving.
                    this.gridPos.x = this.spawnPos.x;
                    this.gridPos.y = this.spawnPos.y;
                    this.ResetPosData();
    
                    for(let i = 0; i < this.playerSocketIDs.length; i++) {
                        // TODO: Pass through anything that the enemy might hold. Enemy could be the keeper of exp, if there will be any...?
                        if(this.playerSocketIDs[i] != null)
                            sprites.allData[Consts.spriteTypes.PLAYER][this.playerSocketIDs[i]].WinBattle();
                    }
    
                    delete sprites.allData[Consts.spriteTypes.ENEMY][this.id];
                    delete sprites.updatePack[Consts.spriteTypes.ENEMY][this.id];
    
                    // Tell everyone in the game to remove this sprite until further notice
                    this.io.emit("RemoveSprite", this.mapSprite);
    
                    //console.log(`Enemy removed: ${this.id}`);
    
                    // REVIVE SELF
                    
                    var self = this;
                    function CheckSpawnPosForRevival () {
                        setTimeout(() => {
                            //console.log("Revival timeout expired");
                            //console.log("Spawn position available: ", mapData.GetValue(self.gridPos) == Consts.spriteTypes.WALK);
                            if(mapData.GetValue(self.gridPos) == Consts.tileTypes.WALK) {
                                //console.log("Calling self revival");
                                self.Revive();
                            }
                            else {
                                //console.log("Spot occupied, recalling CheckSpawnPosForRevival");
                                CheckSpawnPosForRevival();
                            }
                        }, Consts.ENEMY_DEATH_COOLDOWN * 1000);
                    }
                    CheckSpawnPosForRevival();
                }
            }
            // RUN, only other option for now.
            else {
                //console.log("Enemies: Run from battle");
                actionObj.damage = 0;
                // This calls the player which calls this enemy back... a little ridiculous of a process, but works best programatically. :/
                sprites.allData[Consts.spriteTypes.PLAYER][actionObj.fromSocketID].LeaveBattle();
            }

            for(let i = 0; i < socketIDListCopy.length; i++) {
                if(socketIDListCopy[i] != null) {
                    this.io.to(socketIDListCopy[i]).emit('RecPlayerAction', { 
                        socketID: actionObj.fromSocketID,
                        battlePosIdx: i,
                        command: actionObj.command,
                        damage: actionObj.damage,
                        enemyHP: this.hpCurr
                    });
                }
            }
        }

        Revive() {
            //console.log(`Ready to revive enemy: ${this.id}`);

            sprites.allData[Consts.spriteTypes.ENEMY][this.id] = this;
            sprites.updatePack[Consts.spriteTypes.ENEMY][this.id] = this.GetUpdatePack();
            this.isAlive = true;
            this.hpCurr = this.hpMax;
            this.Init();

            this.io.emit("GetServerGameData", { sprites: [ this.GetInitPack() ] });
        }

        CanMoveOnMap() {
            return this.isAlive && !this.inBattle;
        }

        RunMoveTimer() {
            if(!this.CanMoveOnMap())
                return;

            var self = this;
            this.timeoutRef = setTimeout(() => {
                var neighborKeyArr = [ "LEFT", "RIGHT", "UP", "DOWN" ];

                function RecurCheck_neighborKeyArr() {
                    if(neighborKeyArr.length > 0) {
                        var randIndex = Math.floor(Math.random() * neighborKeyArr.length);
                        var cellDiff = Consts.cellDiff[neighborKeyArr[randIndex]];
                        var isBridgeTile = mapData.CheckForBridgeTile(self.gridPos.x + cellDiff.x, self.gridPos.y + cellDiff.y);
                        if(self.neighbors[neighborKeyArr[randIndex]] != Consts.tileTypes.WALK || isBridgeTile) {
                            // Remove that direction and run it again.
                            neighborKeyArr.splice(randIndex, 1);
                            // Keep going till all are checked.
                            return RecurCheck_neighborKeyArr();
                        }
                        return randIndex;
                    }
                    else {
                        return -1;
                    }
                }
                var openTileIndex = RecurCheck_neighborKeyArr();
                if(openTileIndex == -1) {
                     // If none are good, restart entire 5 second timer from scratch.
                     // console.log("Enemy has no tiles to move to.");
                     self.RunMoveTimer();
                }
                else {
                    // In case this functionality is running when a player prompts a battle, this can be skipped over.
                    if(self.CanMoveOnMap()) {
                        var dir = Consts.dirIndex[neighborKeyArr[openTileIndex]];
                        this.pixelPosFrom.x = this.pixelPosActive.x;
                        this.pixelPosFrom.y = this.pixelPosActive.y;
                        self.MoveToCell(Consts.dirDiff[dir]);
                        self.isMoving = true;
                    }
                }
            }, (1 + (Math.random() * self.MOVE_COOLDOWN)) * 1000) // 1 to 3 seconds
        }

        // Pick a random neighbor that can be walked to, walk there, and wait for the moveCooldown before doing so again.
        Update() {
            // I actually do want the enemy to finish their last movement, if one was moving toward a player and initiated battle.
            // The !this.isMoving check should sufficiently take care of block the loop otherwise
            // if(!this.CanMoveOnMap())
            //     return;

            if(!this.isMoving)
                return;

            if (this.moveFracCovered == 0.0) {
                // TODO: Change direction? This should probably be changed wherever the isMoving flag was toggled on.
            }

            this.moveDist += Consts.MAP_MOVE_SPEED;
            this.moveFracCovered = this.moveDist / mapData.GetTileWidth();

            if(this.moveFracCovered < 1.0) {
                // Lerp
                var diffX = (this.pixelPosTo.x - this.pixelPosFrom.x) * this.moveFracCovered;
                var diffY = (this.pixelPosTo.y - this.pixelPosFrom.y) * this.moveFracCovered;
                this.pixelPosActive.x = this.pixelPosFrom.x + diffX;
                this.pixelPosActive.y = this.pixelPosFrom.y + diffY;
                sprites.updatePack[Consts.spriteTypes.ENEMY][this.id] = this.GetUpdatePack();
            }
            else {
                this.pixelPosFrom.x = this.pixelPosActive.x = this.pixelPosTo.x;
                this.pixelPosFrom.y = this.pixelPosActive.y = this.pixelPosTo.y;
                sprites.updatePack[Consts.spriteTypes.ENEMY][this.id] = this.GetUpdatePack();

                this.moveDist = 0.0;
                this.moveFracCovered = 0.0;

                this.isMoving = false;
                this.RunMoveTimer();
            }
        }
    }

    return {
        // TODO: In tiled, enemy spawn points will need to hold more info (just another enum) about the type of enemy.
        PopulateSpawnPoints: () => {
            var enemies = [];

            mapData.GetEnemySpawns().forEach(enemySpawnObj => {
                var enemy = new Enemy(enemySpawnObj);
                enemy.Init();
                enemies.push(enemy);
            });

            return enemies;
        }
    }
}