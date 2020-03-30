// TODO: Run validator on pretty much everything.
var validator = require('validator');
var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    const entityModule = require('./Entity.js')(sprites);

    class Player extends entityModule.Entity {

        socket

        constructor(socket, playerData) {

            playerData.cellData = { 
                spriteType: Consts.spriteTypes.PLAYER, 
                id: socket.client.id 
            };

            super(playerData);
            this.socket = socket;
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
                self.MoveToCell(dirData);
                socket.emit("RecMoveToCell", self.GetMoveData());
            });
        
            socket.on("ReqCellInteraction", function (cellDiff) {
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
        }
        UpdateNeighbors() {
            // Get new neighbors
            this.neighbors.LEFT = mapData.GetValueOffset(this.gridPos, -1, 0);
            this.neighbors.RIGHT = mapData.GetValueOffset(this.gridPos, 1, 0);
            this.neighbors.UP = mapData.GetValueOffset(this.gridPos, 0, -1);
            this.neighbors.DOWN = mapData.GetValueOffset(this.gridPos, 0, 1);

            this.socket.emit('RecUpdateNeighbors', { neighbors: this.neighbors });
        }
        // Recieve new neighbor. TODO: Maybe send back more complicated occupancy data? Maybe not necessary.
        UpdateNeighbor(side, occupancy) {
            //console.log(`Neighbor change: ${side}: ${occupancy}`);
            this.neighbors[side] = occupancy;
            this.socket.emit('RecUpdateNeighbor', { side: side, occupancy: occupancy });
        };
    }

    return {
        Player: Player
    }
}