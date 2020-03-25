// TODO: Run validator on pretty much everything.
var validator = require('validator');
var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

var MapSprite = function (spriteType, id) {
    this.spriteType = spriteType;
    this.id = id;
}


// Tracking the data of every sprite obj in the game
var sprites = {
    allData: {},
    updatePack: {}
}

sprites.allData[Consts.spriteTypes.PLAYER] = {};
sprites.allData[Consts.spriteTypes.ENEMY] = {};
sprites.allData[Consts.spriteTypes.NPC] = {};

sprites.updatePack[Consts.spriteTypes.PLAYER] = {};
sprites.updatePack[Consts.spriteTypes.ENEMY] = {};
sprites.updatePack[Consts.spriteTypes.NPC] = {};

// TODO: Make parent - Sprite - that covers all players, NPCs, and enemies
function Player(socket, playerData) {
    this.socket = socket;
    this.id = playerData.id;
    this.name = playerData.name;
    this.gridPos = playerData.gridPos;
    this.dir = playerData.dir;

    this.mapSprite = new MapSprite(Consts.spriteTypes.PLAYER, this.id);
    mapData.SetValue(this.gridPos, this.mapSprite);
    this.LookForAndUpdateNeighbors(this.gridPos, this.mapSprite);

    this.neighbors = {};
    this.UpdateNeighbors();
}
Player.prototype.SetupNetworkResponses = function (io, socket) {
    
    var player = this;

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
            x: player.gridPos.x + cellDiff.x,
            y: player.gridPos.y + cellDiff.y
        };
        const value = mapData.GetValue(newPos);

        var interactionObj;

        if(value == Consts.tileTypes.SIGN) {
            interactionObj = {
                msg: mapData.GetSignMessage(newPos)
            }
        }

        socket.emit("RecCellInteraction", {
            gridX: newPos.x,
            gridY: newPos.y,
            cellValue: value,
            interactionObj: interactionObj
        });
    });

    // TODO: For everything related to neighbors, account for reaching the edge of the screen and being out of bounds!!
    socket.on("ReqNeighborValue", function (cellDiff) {
        var newPos = { 
            x: player.gridPos.x + cellDiff.x,
            y: player.gridPos.y + cellDiff.y
        };
        socket.emit("RecCellValue", {
            gridX: newPos.x,
            gridY: newPos.y,
            cellValue: mapData.GetValue(newPos)
        });
    });
    socket.on("ReqChangeDir", function (dirData) {
        player.UpdateDir(Consts.dirImg[dirData.key]);
        socket.emit("RecChangeDir", player.dir);
    });
    socket.on("ReqMoveToCell", function (dirData) {
        var newPos = { 
            x: player.gridPos.x + dirData.cellDiff.x,
            y: player.gridPos.y + dirData.cellDiff.y
        };

        if (mapData.GetValue(newPos) == Consts.tileTypes.WALK) {  
            // Tell old neighbors about move out
            mapData.SetValue(player.gridPos, Consts.tileTypes.WALK);
            player.LookForAndUpdateNeighbors(player.gridPos, Consts.tileTypes.WALK);
            // Tell new neighbors about move in
            mapData.SetValue(newPos, player.mapSprite);
            player.LookForAndUpdateNeighbors(newPos, player.mapSprite);
            // Update own position
            player.UpdateMove(newPos, Consts.dirImg[dirData.key]);
            // Update who my own neighbors are
            player.UpdateNeighbors();
        }
        // If all is working correctly, this should never actually come through here, as the client will have stopped the entire call from being made by checking it's neighbors ahead of time.
        else {
            player.UpdateDir(Consts.dirImg[dirData.key]);
        }

        socket.emit("RecMoveToCell", player.GetMoveData());
    });

    socket.on("UpdatePixelPos", function (updatePack) {
        sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id] = updatePack;
    });

    socket.on("ReqChatLogUpdate", function (data) {
        data["msg"] = validator.escape(data["msg"]);
        io.emit("RecChatLogUpdate", data);
    });
}
Player.prototype.UpdateMove = function (newPos, dir) {
    this.gridPos.x = newPos.x;
    this.gridPos.y = newPos.y;
    this.dir = dir;
};
Player.prototype.UpdateDir = function (dir) {
    this.dir = dir;
};
Player.prototype.GetMoveData = function() {
    return {
        x: this.gridPos.x,
        y: this.gridPos.y,
        dir: this.dir
    };
}
Player.prototype.LookForAndUpdateNeighbors = function (cell, value) {
    // Update any potentially new neighbors of this map call that they also have a new neighbor.
    var cellValue = mapData.GetValueXY(cell.x - 1, cell.y);
    if (cellValue.spriteType)
        sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('right', value);

    cellValue = mapData.GetValueXY(cell.x + 1, cell.y);
    if (cellValue.spriteType)
        sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('left', value);

    cellValue = mapData.GetValueXY(cell.x, cell.y -1);
    if (cellValue.spriteType)
        sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('down', value);

    cellValue = mapData.GetValueXY(cell.x, cell.y + 1);
    if (cellValue.spriteType)
        sprites.allData[cellValue.spriteType][cellValue.id].UpdateNeighbor('up', value);
}
Player.prototype.UpdateNeighbors = function () {
    // Get new neighbors
    this.neighbors.left = mapData.GetValueOffset(this.gridPos, -1, 0);
    this.neighbors.right = mapData.GetValueOffset(this.gridPos, 1, 0);
    this.neighbors.up = mapData.GetValueOffset(this.gridPos, 0, -1);
    this.neighbors.down = mapData.GetValueOffset(this.gridPos, 0, 1);
    
    this.socket.emit('RecUpdateNeighbors', { neighbors: this.neighbors });
}
// Recieve new neighbor. TODO: Maybe send back more complicated occupancy data? Maybe not necessary.
Player.prototype.UpdateNeighbor = function (side, occupancy) {
    this.neighbors[side] = occupancy;
    this.socket.emit('RecUpdateNeighbor', { side: side, occupancy: occupancy });
};
Player.prototype.GetInitPack = function () {
    return {
        type: Consts.spriteTypes.PLAYER,
        id: this.id,
        name: this.name,
        gridPos: this.gridPos,
        dir: this.dir  
    }
}

module.exports = function(dbHdlr) {

    return {
        InitSocketCalls: function (io, socket) {

            socket.on("ReqWorldInitData", async function (localStorage) {

                //* Set up this player first
                var orientObj = {};

                // Check database first
                // Sign-in ahead of this call will populate socketID field in db, allowing check here to work.
                var dbPlayer = await dbHdlr.GetPlayerData(socket.client.id);
                if(dbPlayer && dbPlayer["orientation"]) {
                    orientObj = dbPlayer["orientation"];
                }
                // If database isn't being used, use local storage if an object was sent up.
                else if(localStorage != null) {
                    orientObj = localStorage.orientation;
                }
                // Otherwise, create spawn point
                else {
                    // Get a spawn point
                    var spawnIndex = 0;
                    var spawnPoints = mapData.GetPlayerSpawns();
                    for (var i = 0; i < spawnPoints.length; i++) {
                        if (mapData.GetValue(spawnPoints[i]) == Consts.tileTypes.WALK) {
                            spawnIndex = i;
                            // The player has not yet been created, so just set to -1 for now to reserve the spot.
                            mapData.SetValue(spawnPoints[i], -1);
                            break;
                        }
                        // TODO: If none are available? Keep checking? Have way more? Overlap players? Hmmm....
                    }

                    orientObj =  {
                        x: spawnPoints[spawnIndex].x,
                        y: spawnPoints[spawnIndex].y,
                        dir: Consts.dirImg.DOWN
                    };

                    dbHdlr.SaveOrientation(socket.client.id, orientObj);
                }

                // TODO: Get and send all other word init data
                socket.emit("RecWorldInitData", {
                    orientation: orientObj
                });
            });

            socket.on("Play", function (playerData) {
                // TODO: Maybe make this perpetually up-to-date with all sprites, and only packs grabbed when needed, so it doesn't need to be recreated each time.
                var spriteInitPack = []

                for (var type in sprites.allData) {
                    for (var id in sprites.allData[type]) {
                        spriteInitPack.push(sprites.allData[type][id].GetInitPack());
                    }
                }
                
                socket.emit("GetServerGameData", { sprites: spriteInitPack });
                
                // Player's been created, update their neighbors list right away, as this will always determine what their next move can be locally.
                var player = new Player(socket, playerData.initPack);
                player.UpdateNeighbors();

                // Add player to lists
                sprites.allData[Consts.spriteTypes.PLAYER][socket.client.id] = player;
                sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id] = playerData.updatePack;
                
                // Set up all other network responses
                player.SetupNetworkResponses(io, socket);

                // Send new player data to all other players
                socket.broadcast.emit("AddNewPlayer", playerData.initPack);
            });

            // Not a user-made function
            socket.on("disconnect", function () {
                console.log(`Socket connection removed: ${socket.client.id} `);
                
                var player = sprites.allData[Consts.spriteTypes.PLAYER][socket.client.id];
                
                dbHdlr.SaveAndExit(socket.client.id, player ? {
                    x: player.gridPos.x,
                    y: player.gridPos.y,
                    dir: player.dir
                } : null);
                
                if (player) {
                    socket.broadcast.emit("RemoveSprite", player.mapSprite);

                    // Take player off the map
                    mapData.SetValue(player.gridPos, Consts.tileTypes.WALK);
                    
                    // Remove player from server
                    delete sprites.allData[Consts.spriteTypes.PLAYER][socket.client.id];
                    delete sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id];
                }
            });
        },
        GetUpdatePack: function () {
            return sprites.updatePack;
        }
    }
}