var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    function LookForAndUpdateNeighbors(cell, value) {
        // Update any potentially new neighbors of this map call that they also have a new neighbor.

        var cellValue = mapData.GetValueXY(cell.x + 1, cell.y);
        if (isNaN(cellValue)) {
            if(sprites.allData[cellValue.spriteType][cellValue.id])
                sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('LEFT', value);
            else
                console.warn(`Despite being in the map data at x${cell.x + 1}:y${cell.y}, "sprites" list has no entry for spritetype ${cellValue.spriteType}, id ${cellValue.id}.`);
        }
        cellValue = mapData.GetValueXY(cell.x - 1, cell.y);
        if (isNaN(cellValue)) {
            if(sprites.allData[cellValue.spriteType][cellValue.id])
                sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('RIGHT', value);
            else
                console.warn(`"Despite being in the map data at x${cell.x - 1}:y${cell.y}, "sprites" list has no entry for spritetype ${cellValue.spriteType}, id ${cellValue.id}.`);
        }
    
        cellValue = mapData.GetValueXY(cell.x, cell.y + 1);
        if (isNaN(cellValue)) {
            if(sprites.allData[cellValue.spriteType][cellValue.id])
                sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('UP', value);
            else
                console.warn(`"Despite being in the map data at x${cell.x}:y${cell.y + 1}, "sprites" list has no entry for spritetype ${cellValue.spriteType}, id ${cellValue.id}.`);
        }
        cellValue = mapData.GetValueXY(cell.x, cell.y -1);
        if (isNaN(cellValue)) {
            if(sprites.allData[cellValue.spriteType][cellValue.id])
                sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('DOWN', value);
            else
                console.warn(`"Despite being in the map data at x${cell.x}:y${cell.y - 1}, "sprites" list has no entry for spritetype ${cellValue.spriteType}, id ${cellValue.id}.`);
        }
    }

    class Entity {

        id;
        name;
        gridPos;
        dir;
        mapSprite;
        neighbors;
        inBattle;

        hpMax;
        hpCurr;

        strength;
        speed;
        attackOption;

        actionIntervalRef;
        actionIntervalCounter;
        canAct;

        abilityLevel;
        lastAbilityUsed;
        assetKey;

        constructor(initData) {
            this.id = initData.id;
            this.name = initData.name;
            this.gridPos = {
                x: initData.gridPos.x,
                y: initData.gridPos.y
            };
            this.dir = initData.dir;

            this.mapSprite = initData.cellData;

            this.neighbors = { LEFT: null, RIGHT: null, UP: null, DOWN: null };
            this.inBattle = false;

            this.lastAbilityUsed = Consts.abilityUpgrades.INIT;

            this.canAct = true;
            this.speed = 0;
            this.actionIntervalCounter = 0;
            this.attackOption = 0;
        }

        Init() {
            mapData.SetValue(this.gridPos, this.mapSprite);
            LookForAndUpdateNeighbors(this.gridPos, this.mapSprite);
            this.UpdateNeighbors();
        }

        UpdateMove(newPos, dir) {
            this.gridPos.x = newPos.x;
            this.gridPos.y = newPos.y;
            this.dir = dir;
        };
        UpdateDir(dir) {
            this.dir = dir;
        };
        GetMoveData() {
            return {
                x: this.gridPos.x,
                y: this.gridPos.y,
                dir: this.dir
            };
        };

        MoveToCell(dirData) {
            if(this.inBattle)
                return;

            var newPos = { 
                x: this.gridPos.x + dirData.cellDiff.x,
                y: this.gridPos.y + dirData.cellDiff.y
            };

            if (mapData.GetValue(newPos) == Consts.tileTypes.WALK) {
                // Tell old neighbors about move out
                this.RemoveSelfFromMap();
                // Tell new neighbors about move in
                mapData.SetValue(newPos, this.mapSprite);
                LookForAndUpdateNeighbors(newPos, this.mapSprite);
                // Update own position
                this.UpdateMove(newPos, Consts.dirIndex[dirData.key]);
                // Update who my own neighbors are
                this.UpdateNeighbors();
            }
            // If all is working correctly, this should never actually come through here, as the client will have stopped the entire call from being made by checking it's neighbors ahead of time.
            else {
                this.UpdateDir(Consts.dirIndex[dirData.key]);
            }
        };

        RemoveSelfFromMap() {
            mapData.SetValue(this.gridPos, Consts.tileTypes.WALK);
            LookForAndUpdateNeighbors(this.gridPos, Consts.tileTypes.WALK);
        }

        UpdateNeighbors() {
            // Get new neighbors
            this.UpdateNeighbor("LEFT", mapData.GetValueOffset(this.gridPos, -1, 0));
            this.UpdateNeighbor("RIGHT", mapData.GetValueOffset(this.gridPos, 1, 0));
            this.UpdateNeighbor("UP", mapData.GetValueOffset(this.gridPos, 0, -1));
            this.UpdateNeighbor("DOWN", mapData.GetValueOffset(this.gridPos, 0, 1));
        };
        // Recieve new neighbor. TODO: Maybe send back more complicated occupancy data? Maybe not necessary.
        UpdateNeighbor(side, occupancy) {
            this.neighbors[side] = occupancy;
        };
        GetInitPack() {
            return {
                type: this.mapSprite.spriteType,
                gridPos: this.gridPos,
                assetKey: this.assetKey,
                dir: this.dir,
                name: this.name,
                id: this.id
            }
        }

        StopActionTimer() {
            this.actionIntervalCounter = 0;
            clearInterval(this.actionIntervalRef);
        }

        RunActionTimer() {
            // Reduce the ready time based on speed stat, increase it based on ability.
            var cooldown = Consts.ACTION_COOLDOWN_BASE - (this.speed * Consts.ACTION_COOLDOWN_INCR) + (this.lastAbilityUsed * Consts.ACTION_COOLDOWN_INCR);

            var pctFrac = (100 / cooldown) || 0;
            this.actionIntervalRef = setInterval(() => {
                if(!this.inBattle) {
                    this.StopActionTimer();
                    return;
                }

                this.actionIntervalCounter += Consts.INTERVAL_STEP;

                // Each step, send percentage to client for ATB bar fill-up
                //console.log(`Seconds: ${this.actionIntervalCounter * 0.001}, pct: ${this.actionIntervalCounter * pctFrac}`);
                var pctOf100 = Math.floor(this.actionIntervalCounter * pctFrac);
                this.ActionReadyingTick(pctOf100);

                // Timer expired
                if(this.actionIntervalCounter >= cooldown) {
                    this.canAct = true;
                    this.StopActionTimer();
                    this.ActionReady();
                }
                
            }, Consts.INTERVAL_STEP);
        }

        //? Exists only to be overridden
        ActionReadyingTick(percentReady) {}
        ActionReady() {}
    }

    return {
        Entity: Entity
    }
}