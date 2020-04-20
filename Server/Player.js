// TODO: Run validator on pretty much everything.
var validator = require('validator');
var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    const entityModule = require('./Entity.js')(sprites);

    class Player extends entityModule.Entity {

        socket;
        enemyRef;
        battlePosIndex;
        nextBattleReady;

        equipLevel;

        constructor(socket, playerData) {

            playerData.cellData = { 
                spriteType: Consts.spriteTypes.PLAYER, 
                id: socket.client.id 
            };

            super(playerData);
            this.strength = 3;
            this.speed = 1;

            this.socket = socket;
            this.enemyRef = null;
            this.battlePosIndex = -1;
            this.nextBattleReady = true;

            this.equipLevel = playerData.upgrades.equip;
            this.abilityLevel = playerData.upgrades.ability;
            this.ChangeAssetKey(); // Must come after equip level set
        }
        
        SetupNetworkResponses(io, socket) {
            socket.on("ReqNeighborUpdate", (cell) => {
                this.UpdateNeighbors();
            });
        
            // JUST FOR TESTING - TODO: EXPAND SERVER TESTING FUNCTIONS
            socket.on("ReqCellValue", function (cell) {
                socket.emit("RecCellValue", {
                    gridX: cell.x,
                    gridY: cell.y,
                    cellValue: mapData.GetValue(cell)
                });
            });

            socket.on("ReqMoveToCell", (dirData) => {
                // This should sufficiently lock out player movement controls and keep them in place regardless of timing.
                if(this.inBattle) {
                    console.warn(`Client requested to move to new cell, but this.inBattle is ${this.inBattle}`);
                    return;
                }

                this.MoveToCell(dirData);
                socket.emit("RecMoveToCell", this.GetMoveData());
            });
        
            socket.on("ReqCellInteraction", (cellDiff) => {
                // This should sufficiently lock out player command control until battle ends.
                if(this.inBattle) {
                    console.warn(`Client requested to interact with cell, but this.inBattle is ${this.inBattle}`);
                    return;
                }

                var newPos = { 
                    x: this.gridPos.x + cellDiff.x,
                    y: this.gridPos.y + cellDiff.y
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
                                if(interactionObj["wasUpgraded"] = chest.CheckHigherUpgradeValue(this.equipLevel))
                                    interactionObj["upgradeMsg"] = "Found some new equipment!";
                                else
                                    interactionObj["upgradeMsg"] = "Your equipment is the same or better than this.";
                            }
                            else {
                                if(interactionObj["wasUpgraded"] = chest.CheckHigherUpgradeValue(this.abilityLevel))
                                    interactionObj["upgradeMsg"] = "Learned a new technique!";
                                else
                                    interactionObj["upgradeMsg"] = "You've already mastered this technique.";
                            }

                            if(interactionObj["wasUpgraded"]) {
                                interactionObj["contents"] = chest.Open();
                                if(interactionObj["contents"].chestType == Consts.chestTypes.EQUIPMENT) {
                                    this.equipLevel = interactionObj["contents"].upgrade;
                                    this.ChangeAssetKey();
                                    interactionObj["updatedAssetKey"] = this.assetKey;
                                    socket.broadcast.emit("UpdateMapSpriteAssetKey", {
                                        id: this.id,
                                        assetKey: this.assetKey
                                    })
                                }
                                else {
                                    this.abilityLevel = interactionObj["contents"].upgrade;
                                }
                            }
                        }
                    }
                }
                else if(value == Consts.tileTypes.SPRING) {
                    this.hpCurr = this.hpMax;
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
            socket.on("ReqNeighborValue", (cellDiff) => {
                var newPos = { 
                    x: this.gridPos.x + cellDiff.x,
                    y: this.gridPos.y + cellDiff.y
                };
                socket.emit("RecCellValue", {
                    gridX: newPos.x,
                    gridY: newPos.y,
                    cellValue: mapData.GetValue(newPos)
                });
            });
            socket.on("ReqChangeDir", (dirData) => {
                this.UpdateDir(Consts.dirIndex[dirData.key]);
                sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id].dir = this.dir;
                socket.emit("RecChangeDir", this.dir);
            });        
            socket.on("UpdateOrientation", function (updatePack) {
                sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id] = updatePack;
            });
        
            socket.on("ReqChatLogUpdate", function (data) {
                data["msg"] = validator.escape(data["msg"]);
                io.emit("RecChatLogUpdate", data);
            });

            socket.on("BattleAction", (actionObj) => {
                if(!this.enemyRef) {
                    console.warn(`Player ${this.id} tried to battle enemy, but reference lost (battle ended)`);
                    return;
                }
                if(!this.enemyRef.inBattle) {
                    console.warn(`Player ${this.id} tried to battle enemy: ${this.enemyRef.id}, but this.enemyRef.inBattle = ${this.enemyRef.inBattle}. (Battle ended on server as signal was coming up from player)`);
                    return;
                }

                if(!this.inBattle || !this.canAct) {
                    console.warn(`Player ${this.id} tried to battle enemy: ${this.enemyRef.id}, but inBattle is ${this.inBattle} and canAct is ${this.canAct}.`);
                    return;
                }

                this.canAct = false;
                this.lastAbilityUsed = actionObj.ability;

                var actionToEnemy = {
                    command: actionObj.command,
                    ability: actionObj.ability,
                    battleIdx: actionObj.playerBattleIdx,
                    damage: this.strength + this.equipLevel + actionObj.ability,
                    fromSocketID: socket.client.id
                };
                console.log(`Enemy receiving action: `, actionToEnemy);

                this.enemyRef.ReceiveAction(actionToEnemy);
            });

            socket.on("ResetActionTimer", () => {
                if(!this.inBattle) {
                    console.warn(`Resetting action timer from client, but this.inBattle is ${this.inBattle}`);
                    return;
                }

                this.RunActionTimer();
            });

            socket.on("NextBattleReady", () => {
                this.nextBattleReady = true;
            });
        }

        // TODO: Make further character adjustments based on this.
        // Equipement level is currenlt being added to strength as is. Alter/continue as requierd.
        ChangeAssetKey() {
            switch(this.equipLevel) {
                case Consts.equipmentUpgrades.FIGHTER:
                    this.assetKey = "FighterAxeBlue";
                    this.hpCurr = this.hpMax = 20;
                    this.speed = 1;
                    break;
                case Consts.equipmentUpgrades.LORD:
                    this.assetKey = "LordSwordBlue";
                    this.hpCurr = this.hpMax = 25;
                    this.speed = 2;
                    break;
                case Consts.equipmentUpgrades.GENERAL:
                    this.assetKey = "GeneralBlue";
                    this.hpCurr = this.hpMax = 35;
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
            // Neighbor is just a tile, no sprite on it.
            if(!isNaN(neighbor)) {
                return;
            }

            if(!this.nextBattleReady) {
                console.warn(`Player ${this.id} checking neighbors for battle, but this.nextBattleReady is ${this.nextBattleReady}`);
                return;
            }

            if(this.inBattle) {
                console.warn(`Player ${this.id} checking neighbors for battle, but this.inBattle is ${this.inBattle}`);
                return;
            }

            if(neighbor.spriteType == Consts.spriteTypes.ENEMY) {
                if(sprites.allData[Consts.spriteTypes.ENEMY][neighbor.id].CanAddPlayerToBattle()) {
                    this.enemyRef = sprites.allData[Consts.spriteTypes.ENEMY][neighbor.id];
                    this.inBattle = true;
                }
                else {
                    console.warn(`Player ${this.id} new sprite neighbor is an enemy, but cannot add any more players to battle.`);
                    return;
                }
            }
            else {
                console.warn(`Player ${this.id} new sprite neighbor is not an enemy`);
                return;
            }

            //? Let players join battle by simply neighboring another player in battle
            //* Keeping this off for now as it's a little too awkward, and for how few people will play this thing, my map is good enough for now.
            // TODO: Some parts of the map make it too tight to get a full 4-person surround. Consider expanding those areas of the map.
            // else if(neighbor.spriteType == Consts.spriteTypes.PLAYER) {
            //     var player = sprites.allData[Consts.spriteTypes.PLAYER][neighbor.id];
            //     // player may be undefined if this runs through here at spawn time.
            //     if(player && player.inBattle) {
            //         if(this.enemyRef.CanAddPlayerToBattle())
            //             this.inBattle = true;
            //     }
            // }
            
            this.nextBattleReady = false;
            this.battlePosIndex = this.enemyRef.AddPlayerToBattle(this);

            // This index object divides up the position indicies among the players, so everyone knows exactly which player in the battle they are.
            var playerIdxObj = {
                self: this.battlePosIndex,
                others: []
            };

            // Get updated info of all current players
            var playersInBattleData = {};
            for(let i = 0; i < Consts.MAX_PLAYERS_PER_BATTLE; i++) {
                if(this.enemyRef.playersInBattle[i].socketID != null) {
                    var player = sprites.allData[Consts.spriteTypes.PLAYER][this.enemyRef.playersInBattle[i].socketID];
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
            
            //console.log("Call to first run action timer of battle.");
            this.lastAbilityUsed = Consts.abilityUpgrades.INIT; // First cooldown runs standard.
            this.RunActionTimer(); // Calls ActionReady() upon timer completing

            this.socket.emit('RecCommenceBattle', { 
                enemyID: this.enemyRef.id,
                enemyName: this.enemyRef.name,
                enemyAssetKey: this.enemyRef.assetKey,
                enemyHPMax: this.enemyRef.hpMax,
                enemyHPCurr: this.enemyRef.hpCurr,
                playerData: playersInBattleData,
                playerIdxObj: playerIdxObj,
                equipLevel: this.equipLevel,
                abilityLevel: this.abilityLevel
            });
        }

        LeaveBattle(wasDisconnected) {
            if(!this.inBattle) {
                console.warn(`LeaveBattle() was called, but this.inBattle is: ${this.inBattle}.`);
                return;
            }
                
            //* The enemy itself could take care of this when the battle is won, but because the play needs to initiate it both on disconnect, and when RUN is selected, we invoke the enemy here to do it.
            this.enemyRef.RemovePlayerFromBattleOnServer(this.battlePosIndex);
            //* Client removal MUST come after Server removel, to ensure that the call isn't sent out to itself.
            if(wasDisconnected)
                this.enemyRef.RemovePlayerFromBattleOnClient(this.battlePosIndex);

            this.enemyRef = null;
            this.battlePosIndex = -1;
            this.inBattle = false;
        }

        ActionReadyingTick(percentReady) {
            this.enemyRef.UpdatePlayerActionTimer(this.battlePosIndex, percentReady);
        }

        ActionReady() {
            this.socket.emit("RecActionReady");
        }

        // TODO: Implement dodging with it's likelihood being specifically based on when during the action ready timer you are attacked.
        // Logic being, you dodge when you're most alert (closest to the midway point), and advantage being I minimize risk of animations treading on each other.
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