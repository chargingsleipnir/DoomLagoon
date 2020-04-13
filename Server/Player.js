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

        equipLevel;

        constructor(socket, playerData) {

            playerData.cellData = { 
                spriteType: Consts.spriteTypes.PLAYER, 
                id: socket.client.id 
            };

            super(playerData);
            this.hpCurr = this.hpMax = 20;
            this.strength = 3;
            this.speed = 1;

            this.socket = socket;
            this.enemyID = -1;
            this.battlePosIndex = -1;
            this.nextBattleReady = true;

            this.equipLevel = playerData.upgrades.equip;
            this.abilityLevel = playerData.upgrades.ability;
            this.ChangeAssetKey(); // Must come after equip level set
        }
        
        SetupNetworkResponses(io, socket) {
            var self = this;

            socket.on("ReqNeighborUpdate", function (cell) {
                self.UpdateNeighbors();
            });
        
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
                if(self.inBattle) {
                    console.warn(`Client requested to move to new cell, but self.inBattle is ${self.inBattle}`);
                    return;
                }

                self.MoveToCell(dirData);
                socket.emit("RecMoveToCell", self.GetMoveData());
            });
        
            socket.on("ReqCellInteraction", function (cellDiff) {
                // This should sufficiently lock out player command control until battle ends.
                if(self.inBattle) {
                    console.warn(`Client requested to interact with cell, but self.inBattle is ${self.inBattle}`);
                    return;
                }

                var newPos = { 
                    x: self.gridPos.x + cellDiff.x,
                    y: self.gridPos.y + cellDiff.y
                };
                const value = mapData.GetValue(newPos);
        
                var interactionObj = null;
        
                if(value == Consts.tileTypes.SIGN) {
                    interactionObj = {
                        msg: mapData.GetSignMessage(newPos)
                    }
                }
                else if(value == Consts.tileTypes.CHEST) {
                    var chest = mapData.GetChest(newPos);
                    if(chest) {
                        if(!chest.GetIsOpen()) {
                            interactionObj = { wasUpgraded: false, upgradeMsg: "" };
                            if(chest.CheckSameUpgradeType(Consts.chestTypes.EQUIPMENT)) {
                                if(interactionObj["wasUpgraded"] = chest.CheckHigherUpgradeValue(self.equipLevel))
                                    interactionObj["upgradeMsg"] = "Found some new equipment!";
                                else
                                    interactionObj["upgradeMsg"] = "Your equipment is the same or better than this.";
                            }
                            else {
                                if(interactionObj["wasUpgraded"] = chest.CheckHigherUpgradeValue(self.abilityLevel))
                                    interactionObj["upgradeMsg"] = "Learned a new technique!";
                                else
                                    interactionObj["upgradeMsg"] = "You've already mastered this technique.";
                            }

                            if(interactionObj["wasUpgraded"]) {
                                interactionObj["contents"] = chest.Open();
                                if(interactionObj["contents"].chestType == Consts.chestTypes.EQUIPMENT) {
                                    self.equipLevel = interactionObj["contents"].upgrade;
                                    self.ChangeAssetKey();
                                    interactionObj["updatedAssetKey"] = self.assetKey;
                                    socket.broadcast.emit("UpdateMapSpriteAssetKey", {
                                        id: self.id,
                                        assetKey: self.assetKey
                                    })
                                }
                                else {
                                    self.abilityLevel = interactionObj["contents"].upgrade;
                                }
                            }
                        }
                    }
                }
                else if(value == Consts.tileTypes.SPRING) {
                    self.hpCurr = self.hpMax;
                    interactionObj = {
                        msg: "Recovered full health!"
                    }
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

            socket.on("BattleAction", function (actionObj) {
                console.log(`Received battle action, canAct: ${self.canAct}, against enemyID: ${self.enemyID}`);

                if(!self.inBattle) {
                    console.warn(`Command received from client, but self.inBattle is ${self.inBattle}`);
                    return;
                }

                if(self.enemyID == -1) {
                    console.warn(`Command received from client, but self.enemyID is ${self.enemyID}`);
                    return;
                }

                if(!self.canAct) {
                    console.warn(`Command received from client, but self.canAct is ${self.canAct}`);
                    return;
                }

                self.canAct = false;
                self.lastAbilityUsed = actionObj.ability;

                var actionToEnemy = {
                    command: actionObj.command,
                    ability: actionObj.ability,
                    battleIdx: actionObj.playerBattleIdx,
                    damage: self.strength + self.equipLevel + actionObj.ability,
                    fromSocketID: socket.client.id
                };
                console.log(`Enemy receiving action: `, actionToEnemy);

                // TODO: Implement ability as speed factor.
                sprites.allData[Consts.spriteTypes.ENEMY][self.enemyID].ReceiveAction(actionToEnemy);
            });

            socket.on("ResetActionTimer", function () {
                if(!self.inBattle) {
                    console.warn(`Resetting action timer from client, but self.inBattle is ${self.inBattle}`);
                    return;
                }

                self.RunActionTimer();
            });

            socket.on("NextBattleReady", function () {
                self.nextBattleReady = true;
            });
        }

        // TODO: Make further character adjustments based on this.
        // Equipement level is currenlt being added to strength as is. Alter/continue as requierd.
        ChangeAssetKey() {
            switch(this.equipLevel) {
                case Consts.equipmentUpgrades.FIGHTER:
                    this.assetKey = "FighterAxeBlue";
                    this.hpMax = 20;
                    this.speed = 1;
                    break;
                case Consts.equipmentUpgrades.LORD:
                    this.assetKey = "LordSwordBlue";
                    this.hpMax = 20;
                    this.speed = 2;
                    break;
                case Consts.equipmentUpgrades.KNIGHT:
                    this.assetKey = "KnightLanceBlue";
                    this.hpMax = 30;
                    this.speed = 3;
                    break;
            }
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
            if(!this.nextBattleReady) {
                console.warn(`Checking neighbors for battle, but this.nextBattleReady is ${this.nextBattleReady}`);
                return;
            }

            if(this.inBattle) {
                console.warn(`Checking neighbors for battle, but this.inBattle is ${this.inBattle}`);
                return;
            }

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
                                assetKey: player.assetKey,
                                hpMax: player.hpMax,
                                hpCurr: player.hpCurr
                            }

                            if(playerIdxObj.self != i) {
                                playerIdxObj.others.push(i);
                            }
                        }
                    }
                    
                    console.log("Call to first run action timer of battle.");
                    this.lastAbilityUsed = Consts.abilityUpgrades.INIT; // First cooldown runs standard.
                    this.RunActionTimer(); // Calls ActionReady() upon timer completing

                    this.socket.emit('RecCommenceBattle', { 
                        enemyID: this.enemyID,
                        enemyName: enemy.name,
                        enemyAssetKey: enemy.assetKey,
                        enemyHPMax: enemy.hpMax,
                        enemyHPCurr: enemy.hpCurr,
                        playerData: playersInBattleData,
                        playerIdxObj: playerIdxObj,
                        equipLevel: this.equipLevel,
                        abilityLevel: this.abilityLevel
                    });
                }
            }
        }

        LeaveBattle(wasDisconnected) {
            if(!this.inBattle) {
                console.warn("LeaveBattle() was called, but this.inBattle is: ", this.inBattle);
                return;
            }
                
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
            console.log("Action ready.");
            this.socket.emit("RecActionReady");
        }

        ReceiveAttack(damage) {
            this.hpCurr -= damage;

            // Player was killed
            if(this.hpCurr <= 0) {
                this.hpCurr = 0;

                this.LeaveBattle(false);
                this.StopActionTimer();
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

        Disconnect() {
            this.LeaveBattle(true);
            this.RemoveSelfFromMap();
        }
    }

    return {
        Player: Player
    }
}