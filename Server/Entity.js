var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    class Entity {

        id;
        name;
        gridPos;
        dir;
        mapSprite;

        constructor(initData) {
            this.id = initData.id;
            this.name = initData.name;
            this.gridPos = initData.gridPos;
            this.dir = initData.dir;

            this.mapSprite = initData.cellData;
            mapData.SetValue(this.gridPos, this.mapSprite);

            this.neighbors = {};
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
        }
        UpdateNeighbors() {
            // Get new neighbors
            this.neighbors.left = mapData.GetValueOffset(this.gridPos, -1, 0);
            this.neighbors.right = mapData.GetValueOffset(this.gridPos, 1, 0);
            this.neighbors.up = mapData.GetValueOffset(this.gridPos, 0, -1);
            this.neighbors.down = mapData.GetValueOffset(this.gridPos, 0, 1);
            console.log("UpdateNeighbors in Entity");
        }
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