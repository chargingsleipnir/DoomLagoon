//var entity = require('./Entity.js')();

var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    const entityModule = require('./Entity.js')(sprites);

    // Since I'll only be reusing a small amount of enemies, less than 100, this is as much as I need to do for their ids
    var enemyID = 100;

    class Enemy extends entityModule.Entity {
        spawnPos;
        pixelPosActive;
        pixelPosFrom;
        pixelPosTo;

        isMoving;
        moveDist;
        moveFracCovered;
        MOVE_COOLDOWN = 2;

        // Going to maintain this as always full list of nulls and/or socketIDs so I can use the indices to send to the clients to match their locations.
        playersInBattle;
        playerBattleCount;
        isAlive;

        io;
        moveTimeoutRef;
        actionCooldownTimeoutRef;

        actionReadyPct;

        constructor(enemySpawnObj) {
            enemySpawnObj.id = enemyID;
            enemyID++;
            // Not set in Tiled - no real need to be
            enemySpawnObj.dir = Consts.dirIndex.DOWN;

            // Add the sub-typing into the cell data to reach the Client
            var assetKey = enemySpawnObj.props['assetKey'];
            enemySpawnObj.cellData = { 
                spriteType: Consts.spriteTypes.ENEMY,
                id: enemySpawnObj.id,
                assetKey: assetKey != "" ? assetKey : null
            };

            if(enemySpawnObj.cellData.assetKey == null)
                console.error("Some Enemy not given an asset Key in Tiled");

            super(enemySpawnObj);

            this.assetKey = assetKey;
            this.spawnPos = {
                x: this.gridPos.x,
                y: this.gridPos.y
            };
            
            this.ResetPosData();

            this.playersInBattle = [];
            this.playerBattleCount = 0;
            for(let i = 0; i < Consts.MAX_PLAYERS_PER_BATTLE; i++) {
                this.playersInBattle.push({
                    actionReadyPct: 0,
                    socketID: null
                });
            }

            this.actionReadyPct = 0;
            this.isAlive = true;

            //* This switch statement might be more than sufficient to distinguish among each type of enemy for such a limited game sample
            // TODO: If not, Give each enemy type it's own class, "extended" from an "Enemy" base class, With "Enemy Factory" a separate thing (file or class) that creates the derived classes based on the map data.
            switch(this.assetKey) {
                case Consts.enemyAssetKeys.KNIGHT_AXE_RED:
                    this.name = "Knight";
                    this.hpCurr = this.hpMax = 10;
                    this.strength = 3;
                    this.abilityLevel = Consts.abilityUpgrades.LEVEL2;
                    this.actionCooldown = 4000;
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

        AddPlayerToBattle(player) {
            if(!this.CanAddPlayerToBattle())
                return;

            var battlePosIndex = -1;
            var battleJustStarted = false;

            //console.log(`Socket ID pushed into battle group: ${player.id}`);
            for(let i = 0; i < Consts.MAX_PLAYERS_PER_BATTLE; i++) {
                if(this.playersInBattle[i].socketID == null) {
                    this.playersInBattle[i].socketID = player.id;
                    this.playerBattleCount++;

                    this.inBattle = true;
                    battlePosIndex = i;

                    // First player added means battle just started - launch action timer
                    battleJustStarted = this.playerBattleCount == 1;

                    // Let all other active battle participants know to add this player
                    for(let j = 0; j < Consts.MAX_PLAYERS_PER_BATTLE; j++) {
                        if(j == i)
                            continue;

                        if(this.playersInBattle[j].socketID != null) {
                            this.io.to(this.playersInBattle[j].socketID).emit('RecAddPlayer', {
                                name: player.name,
                                assetKey: player.assetKey,
                                battlePosIndex: battlePosIndex,
                                hpMax: player.hpMax,
                                hpCurr: player.hpCurr
                            });
                        }
                    }
                    break;
                }
            }

            if(battleJustStarted) {
                clearTimeout(this.moveTimeoutRef);
                this.RunActionTimer();
            }

            return battlePosIndex;
        }

        GetBattlePosIndex(socketID) {
            var idx = -1;
            for(let i = 0; i < this.playersInBattle.length; i++) {
                if(this.playersInBattle[i].socketID == socketID) {
                    idx = i;
                    break;
                }
            }

            return idx;
        }

        RemovePlayerFromBattleOnServer(battlePosIdx) {
            if(this.playerBattleCount > 0) {
                if(battlePosIdx > -1) {
                    //console.log(`Removed player ${this.playersInBattle[battlePosIdx].socketID}`);
                    this.playersInBattle[battlePosIdx].socketID = null;
                    this.playersInBattle[battlePosIdx].actionReadyPct = 0;
                    this.playerBattleCount--;
                    //console.log(`Players remaining in list ${this.playerBattleCount}`);

                    this.inBattle = this.playerBattleCount > 0;
                    if(this.CanMoveOnMap()) {
                        this.hpCurr = this.hpMax;
                        this.RunMoveTimer();
                    }
                }
            }
        }

        RemovePlayerFromBattleOnClient(battlePosIdx) {
            for(let i = 0; i < Consts.MAX_PLAYERS_PER_BATTLE; i++) {
                if(this.playersInBattle[i].socketID != null)
                    this.io.to(this.playersInBattle[i].socketID).emit('RecLosePlayer', battlePosIdx);
            }
        }

        ReceiveAction(actionObj) {
            //* In the event that 2 or more players input the finishing blow on the enemy at nearly the same time, this should prevent both actions from registering, as the block is created just a few lines away.
            //! Still not perfect though :<
            if(this.hpCurr <= 0) {
                return;
            }

            // This is necessary to be able to emit a signal to all battle members after they are removed from the battle and their socketID is lost
            var socketIDListCopy = [];
            for(let i = 0; i < this.playersInBattle.length; i++) {
                socketIDListCopy.push({
                    actionReadyPct: this.playersInBattle[i].actionReadyPct,
                    socketID: this.playersInBattle[i].socketID
                });
            }

            if(actionObj.command == Consts.battleCommands.FIGHT) {
                this.hpCurr -= actionObj.damage;
                if(this.hpCurr <= 0) {
                    this.hpCurr = 0;
                    this.isAlive = false;
                    this.inBattle = false;
                    // Stop action timer if it was running, and action cooldown (small gap to allow for client animations) if that was.
                    this.StopActionTimer();
                    clearTimeout(this.actionCooldownTimeoutRef);
                    // Deactivate self from map
                    this.RemoveSelfFromMap();
    
                    // Reset back to spawn position and wait for it to be clear before reviving.
                    this.gridPos.x = this.spawnPos.x;
                    this.gridPos.y = this.spawnPos.y;
                    this.ResetPosData();
    
                    for(let i = 0; i < this.playersInBattle.length; i++) {
                        // TODO: Pass through anything that the enemy might hold like exp, if there will be any...?
                        if(this.playersInBattle[i].socketID != null)
                            sprites.allData[Consts.spriteTypes.PLAYER][this.playersInBattle[i].socketID].LeaveBattle(false);
                    }
    
                    // Tell everyone in the game to remove this enemy sprite until further notice
                    this.io.emit("RemoveMapSprite", this.mapSprite);

                    // Remove this enemy for now
                    delete sprites.allData[Consts.spriteTypes.ENEMY][this.id];
                    delete sprites.updatePack[Consts.spriteTypes.ENEMY][this.id];    
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


            // console.log(`Battle won for player ${this.socket.client.id}`);
            // TODO: database update as needed
            // TODO: Send win object/information to client through here if there was a win.
            for(let i = 0; i < socketIDListCopy.length; i++) {
                if(socketIDListCopy[i].socketID != null) {
                    this.io.to(socketIDListCopy[i].socketID).emit('RecPlayerAction', { 
                        socketID: actionObj.fromSocketID,
                        actorBattleIdx: actionObj.battleIdx,
                        targetBattleIdx: -1,
                        command: actionObj.command,
                        ability: actionObj.ability,
                        damage: actionObj.damage,
                        targetHPMax: this.hpMax,
                        targetHPCurr: this.hpCurr
                    });
                }
            }
        }

        ActionReadyingTick(percentReady) {
            this.actionReadyPct = percentReady;
        }
        // Enemy attack
        ActionReady() {
            // Pick a random attack from what's available per enemy. (Based on ability upgrade)
            var randAbility = Math.floor(Math.random() * (this.abilityLevel + 1));

            // Because of the dispersal of actual players in "this.playersInBattle", get a random number limited by how many active players there are (wherever in the list they may be),
            // and loop through that many active players to hit the random one. Hence using the random number as a negative counter.
            var randPlayerCounter = 1 + Math.floor(Math.random() * this.playerBattleCount);
            var attackIndex = -1;

            // Loop is required to actually get the index of the correct player
            for(let i = 0; i < this.playersInBattle.length; i++) {
                if(this.playersInBattle[i].socketID == null)
                    continue;

                randPlayerCounter--;
                if(randPlayerCounter > 0)
                    continue;
                else {
                    attackIndex = i;
                    break;
                }
            }

            var player = sprites.allData[Consts.spriteTypes.PLAYER][this.playersInBattle[attackIndex].socketID];
            var attackKilled = player.ReceiveAttack(this.strength);

            var actionObj = { 
                socketID: player.id, //? Don't need to send this?
                actorBattleIdx: -1,
                targetBattleIdx: attackIndex,
                command: Consts.battleCommands.FIGHT,
                ability: randAbility,
                damage: this.strength,
                targetHPMax: player.hpMax,
                targetHPCurr: player.hpCurr
            };

            console.log(`Enemy performing action: `, actionObj);
            
            // If killed, this player will not be included in the call below, so they need their own.
            if(attackKilled) {
                player.socket.emit("RecEnemyAction", actionObj);
                player.Destroy();
            }

            // This will either include the attacked player, simply resulting in a reduction of their hp, or
            // not if they were killed, in which case they're calling their socket's "RecBattleLost".
            for(let i = 0; i < this.playersInBattle.length; i++)
                if(this.playersInBattle[i].socketID != null)
                    this.io.to(this.playersInBattle[i].socketID).emit('RecEnemyAction', actionObj);

            // Might have killed the last player (this.inBattle will toggle when player is removed [down line through player.Attack]), but if not, keep attacking.
            // Apply a small delay to allow for client animations. Although it'd be best to let an animation run and hear back, from which player? The multiplayer setup is not conducive to that.
            if(this.inBattle)
                this.actionCooldownTimeoutRef = setTimeout(() => { this.RunActionTimer(); }, 2000);
        }

        // Tell all battle players of the given player's action timer percentage
        UpdatePlayerActionTimer(battlePosIndex, percentReady) {
            this.playersInBattle[battlePosIndex].actionReadyPct = percentReady;
            // TODO: hold/pool percentages, and update continually during battle as the enemy does so itself, or perhaps in the enemy's update loop.
            // As the enemy itself should take little pauses to give the animations space to play.
        }

        Revive() {
            console.log(`Ready to revive enemy: ${this.id}`);

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
            this.moveTimeoutRef = setTimeout(() => {
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

            // Send action timer updates to everyone in battle
            if(this.playerBattleCount > 0) {

                // TODO: Either a preliminary loop to get the percentage data alone,
                // TODO: OR, just send everyone the whole "playersInBattle" object,
                // TODO: Either way, this.actionReadyPct goes with it under "enemyPct" or something.
                var pctObj = { "-1": this.actionReadyPct };
                for(let i = 0; i < this.playersInBattle.length; i++) {
                    if(this.playersInBattle[i].socketID != null) {
                        pctObj[i] = this.playersInBattle[i].actionReadyPct;
                    }
                }

                for(let i = 0; i < this.playersInBattle.length; i++) {
                    if(this.playersInBattle[i].socketID != null) {
                        this.io.to(this.playersInBattle[i].socketID).emit("RecActionReadyingTick", pctObj);
                    }
                }
            }

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