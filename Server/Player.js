var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');


module.exports = function(sprites) {

    const EntityModule = require('./Entity.js')(sprites, Consts.spriteTypes.PLAYER);

    class Player extends EntityModule.EntityClass {

        socket

        constructor(socket, playerData) {
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
                self.UpdateDir(Consts.dirImg[dirData.key]);
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
            this.neighbors.left = mapData.GetValueOffset(this.gridPos, -1, 0);
            this.neighbors.right = mapData.GetValueOffset(this.gridPos, 1, 0);
            this.neighbors.up = mapData.GetValueOffset(this.gridPos, 0, -1);
            this.neighbors.down = mapData.GetValueOffset(this.gridPos, 0, 1);

            this.socket.emit('RecUpdateNeighbors', { neighbors: this.neighbors });
        }
        // Recieve new neighbor. TODO: Maybe send back more complicated occupancy data? Maybe not necessary.
        UpdateNeighbor(side, occupancy) {
            this.neighbors[side] = occupancy;
            this.socket.emit('RecUpdateNeighbor', { side: side, occupancy: occupancy });
        };
    }

    return {
        GetNewPlayer: (socket, playerData) => {
            return new Player(socket, playerData);
        }
    }
}