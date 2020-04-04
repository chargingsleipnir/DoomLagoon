// TODO: Run validator on pretty much everything.
var validator = require('validator');
var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    const entityModule = require('./Entity.js')(sprites);

    class Player extends entityModule.Entity {

        socket;
        enemyID;
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
            this.nextBattleReady = true;
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
                if(self.enemyID == -1)
                    return;

                sprites.allData[Consts.spriteTypes.ENEMY][self.enemyID].Enact({
                    command: actionObj.command,
                    damage: self.strength,
                    fromSocketID: socket.client.id
                });
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
                    enemy.AddPlayerToBattle(this.socket.client.id);
                    this.socket.emit('RecCommenceBattle', { enemyID: this.enemyID });
                }
            }
        }

        LeaveBattle() {
            if(!this.inBattle)
                return;
                
            //console.log(`Reseting player battle props: enemyID: ${this.enemyID}, inBattle: ${this.inBattle}`);
            
            //* The enemy itself could take care of this when the battle is won, but because the play needs to initiate it both on disconnect, and when RUN is selected, we invoke the enemy here to do it.
            sprites.allData[Consts.spriteTypes.ENEMY][this.enemyID].RemovePlayerFromBattle(this.socket.client.id);
            this.enemyID = -1;
            this.inBattle = false;
        }

        WinBattle() {
            // console.log(`Battle won for player ${this.socket.client.id}`);
            // TODO: database update as needed
            // TODO: Send win information to local player.
            this.LeaveBattle();
            this.socket.emit("RecBattleWon");
        }

        Disconnect() {
            this.LeaveBattle();
            this.RemoveSelf();
        }
    }

    return {
        Player: Player
    }
}