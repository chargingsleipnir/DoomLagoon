// TODO: Run validator on pretty much everything.
var validator = require('validator');
var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    const entityModule = require('./Entity.js')(sprites);

    class Player extends entityModule.Entity {

        socket;
        enemyID;
        battlePosIndex;
        nextBattleReady;

        constructor(socket, playerData) {

            playerData.cellData = { 
                spriteType: Consts.spriteTypes.PLAYER, 
                id: socket.client.id 
            };

            super(playerData);
            this.hpCurr = this.hpMax = 20;
            this.strength = 3;

            this.socket = socket;
            this.enemyID = -1;
            this.battlePosIndex = -1;
            this.nextBattleReady = true;

            this.actionCooldown = 3500;
        }
        
        SetupNetworkResponses(io, socket) {
            var self = this;
        
            // JUST FOR TESTING - TODO: EXPAND SERVER TESTING FUNCTIONS
            socket.on("ReqCellValue", function (cell) {
                socket.emit("RecCellValue", {
                    gridX: cell.x,
                    gridY: cell.y,
                    cellValue: mapData.GetValue(cell)
                });
            });

            socket.on("ReqMoveToCell", function (dirData) {
                // This should sufficiently lock out player movement controls and keep them in place regardless of timing.
                if(self.inBattle)
                    return;

                self.MoveToCell(dirData);
                socket.emit("RecMoveToCell", self.GetMoveData());
            });
        
            socket.on("ReqCellInteraction", function (cellDiff) {
                // This should sufficiently lock out player command control until battle ends.
                if(self.inBattle)
                    return;

                var newPos = { 
                    x: self.gridPos.x + cellDiff.x,
                    y: self.gridPos.y + cellDiff.y
                };
                const value = mapData.GetValue(newPos);
        
                var interactionObj;
        
                if(value == Consts.tileTypes.SIGN) {
                    interactionObj = {
                        msg: mapData.GetSignMessage(newPos)
                    }
                }
                else if(value == Consts.tileTypes.CHEST) {
                    interactionObj = mapData.GetChestContents(newPos)
                }
        
                socket.emit("RecCellInteraction", {
                    gridX: newPos.x,
                    gridY: newPos.y,
                    cellValue: value,
                    interactionObj: interactionObj
                });
            });
            socket.on("ReqNeighborValue", function (cellDiff) {
                var newPos = { 
                    x: self.gridPos.x + cellDiff.x,
                    y: self.gridPos.y + cellDiff.y
                };
                socket.emit("RecCellValue", {
                    gridX: newPos.x,
                    gridY: newPos.y,
                    cellValue: mapData.GetValue(newPos)
                });
            });
            socket.on("ReqChangeDir", function (dirData) {
                self.UpdateDir(Consts.dirIndex[dirData.key]);
                sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id].dir = self.dir;
                socket.emit("RecChangeDir", self.dir);
            });        
            socket.on("UpdateOrientation", function (updatePack) {
                sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id] = updatePack;
            });
        
            socket.on("ReqChatLogUpdate", function (data) {
                data["msg"] = validator.escape(data["msg"]);
                io.emit("RecChatLogUpdate", data);
            });

            // JUST FOR TESTING - TODO: EXPAND SERVER TESTING FUNCTIONS
            socket.on("BattleAction", function (actionObj) {
                //console.log(`Received battle action, enemyID: ${self.enemyID}, canAct: ${self.canAct}`);

                if(self.enemyID == -1)
                    return;

                if(!self.canAct)
                    return;

                self.canAct = false;

                sprites.allData[Consts.spriteTypes.ENEMY][self.enemyID].ReceiveAction({
                    command: actionObj.command,
                    battleIdx: actionObj.playerBattleIdx,
                    damage: self.strength,
                    fromSocketID: socket.client.id
                });
            });

            socket.on("ResetActionTimer", function () {
                if(!self.inBattle)
                    return;

                self.RunActionTimer();
            });

            socket.on("NextBattleReady", function () {
                self.nextBattleReady = true;
            });
        }
        UpdateNeighbors() {
            // Get new neighbors
            this.neighbors.LEFT = mapData.GetValueOffset(this.gridPos, -1, 0);
            this.neighbors.RIGHT = mapData.GetValueOffset(this.gridPos, 1, 0);
            this.neighbors.UP = mapData.GetValueOffset(this.gridPos, 0, -1);
            this.neighbors.DOWN = mapData.GetValueOffset(this.gridPos, 0, 1);

            if(this.nextBattleReady) {
                this.CheckForBattle(this.neighbors.LEFT);
                this.CheckForBattle(this.neighbors.RIGHT);
                this.CheckForBattle(this.neighbors.UP);
                this.CheckForBattle(this.neighbors.DOWN);
            }

            this.socket.emit('RecUpdateNeighbors', { neighbors: this.neighbors, inBattle: this.inBattle });
        }
        // Recieve new neighbor. TODO: Maybe send back more complicated occupancy data? Maybe not necessary.
        UpdateNeighbor(side, occupancy) {
            //console.log(`Neighbor change: ${side}: ${occupancy}`);
            this.neighbors[side] = occupancy;

            if(this.nextBattleReady) {
                this.CheckForBattle(occupancy);
            }

            this.socket.emit('RecUpdateNeighbor', { side: side, occupancy: occupancy, inBattle: this.inBattle });
        };
        CheckForBattle(neighbor) {
            if(!this.nextBattleReady)
                return;

            if(this.inBattle)
                return;

            if(isNaN(neighbor)) {

                var enemy;

                if(neighbor.spriteType == Consts.spriteTypes.ENEMY) {
                    enemy = sprites.allData[Consts.spriteTypes.ENEMY][neighbor.id];
                    if(enemy.CanAddPlayerToBattle())
                        this.inBattle = true;
                }

                //? Let players join battle by simply neighboring another player in battle
                //* Keeping this off for now as it's a little too awkward, and for how few people will play this thing, my map is good enough for now.
                // TODO: Some parts of the map make it too tight to get a full 4-person surround. Consider expanding those areas of the map.
                // else if(neighbor.spriteType == Consts.spriteTypes.PLAYER) {
                //     var player = sprites.allData[Consts.spriteTypes.PLAYER][neighbor.id];
                //     // player may be undefined if this runs through here at spawn time.
                //     if(player && player.inBattle) {
                //         enemy = sprites.allData[Consts.spriteTypes.ENEMY][player.enemyID];
                //         if(enemy.CanAddPlayerToBattle())
                //             this.inBattle = true;
                //     }
                // }
                

                if(this.inBattle) {
                    this.nextBattleReady = false;
                    this.enemyID = enemy.id;

                    this.battlePosIndex = enemy.AddPlayerToBattle(this);
                    // This index object divides up the position indicies among the players, so everyone knows exactly which player in the battle they are.
                    var playerIdxObj = {
                        self: this.battlePosIndex,
                        others: []
                    };

                    var playersInBattleData = {};
                    // Get updated info of all current players
                    for(let i = 0; i < Consts.MAX_PLAYERS_PER_BATTLE; i++) {
                        if(enemy.playersInBattle[i].socketID != null) {
                            var player = sprites.allData[Consts.spriteTypes.PLAYER][enemy.playersInBattle[i].socketID];
                            playersInBattleData[i] = {
                                name: player.name,
                                hpMax: player.hpMax,
                                hpCurr: player.hpCurr
                            }

                            if(playerIdxObj.self != i) {
                                playerIdxObj.others.push(i);
                            }
                        }
                    }
                    
                    this.RunActionTimer(); // Calls ActionReady() upon timer completing

                    this.socket.emit('RecCommenceBattle', { 
                        enemyID: this.enemyID,
                        enemyName: enemy.name,
                        enemyHPMax: enemy.hpMax,
                        enemyHPCurr: enemy.hpCurr,
                        playerData: playersInBattleData,
                        playerIdxObj: playerIdxObj,
                    });
                }
            }
        }

        LeaveBattle(wasDisconnected) {
            if(!this.inBattle)
                return;
                
            //console.log(`Reseting player battle props: enemyID: ${this.enemyID}, inBattle: ${this.inBattle}`);
            
            //* The enemy itself could take care of this when the battle is won, but because the play needs to initiate it both on disconnect, and when RUN is selected, we invoke the enemy here to do it.
            sprites.allData[Consts.spriteTypes.ENEMY][this.enemyID].RemovePlayerFromBattleOnServer(this.battlePosIndex);
            if(wasDisconnected)
                sprites.allData[Consts.spriteTypes.ENEMY][this.enemyID].RemovePlayerFromBattleOnClient(this.battlePosIndex);
            
            this.enemyID = -1;
            this.battlePosIndex = -1;
            this.inBattle = false;
        }

        ActionReadyingTick(percentReady) {
            sprites.allData[Consts.spriteTypes.ENEMY][this.enemyID].UpdatePlayerActionTimer(this.battlePosIndex, percentReady);
        }

        ActionReady() {
            this.socket.emit("RecActionReady");
        }

        ReceiveAttack(damage) {
            this.hpCurr -= damage;

            // Player was killed
            if(this.hpCurr <= 0) {
                this.hpCurr = 0;

                this.LeaveBattle(false);
                this.RemoveSelfFromMap();

                this.socket.broadcast.emit("RemoveMapSprite", this.mapSprite);
                return true;
            }
            return false;
        }

        Destroy() {
            delete sprites.allData[Consts.spriteTypes.PLAYER][this.id];
            delete sprites.updatePack[Consts.spriteTypes.PLAYER][this.id];
        }

        // Update() {
        //     console.log("Player update");
        // }

        Disconnect() {
            this.LeaveBattle(true);
            this.RemoveSelfFromMap();
        }
    }

    return {
        Player: Player
    }
}