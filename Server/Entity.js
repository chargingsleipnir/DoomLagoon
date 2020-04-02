var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    function LookForAndUpdateNeighbors(cell, value) {
        // Update any potentially new neighbors of this map call that they also have a new neighbor.
        
        var cellValue = mapData.GetValueXY(cell.x + 1, cell.y);
        if (isNaN(cellValue))
            sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('LEFT', value);
        
        cellValue = mapData.GetValueXY(cell.x - 1, cell.y);
        if (isNaN(cellValue)) {
            sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('RIGHT', value);
        }
    
        cellValue = mapData.GetValueXY(cell.x, cell.y + 1);
        if (isNaN(cellValue))
            sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('UP', value);
    
        cellValue = mapData.GetValueXY(cell.x, cell.y -1);
        if (isNaN(cellValue))
            sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('DOWN', value);
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
                this.RemoveSelf();
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

        RemoveSelf() {
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
                id: this.id,
                name: this.name,
                gridPos: this.gridPos,
                dir: this.dir  
            }
        }
    }

    return {
        Entity: Entity
    }
}