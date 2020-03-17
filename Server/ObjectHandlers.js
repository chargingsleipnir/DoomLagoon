//var validator = require('validator');

 // Automatic proper parsing!
var mapJSONData = require('../Shared/DataFiles/mapPH.json');
var Consts = require('../Shared/Consts.js');

// TODO: Some of these indicies are very hard-coded for now, will need to be made dynamic when tilset is expanded.
var mapTileIndicies = {};
var tilesArr = mapJSONData.tilesets[0].tiles;
for(var i = 0; i < tilesArr.length; i++) {
    mapTileIndicies[tilesArr[i].properties[0].value] = tilesArr[i].id + 1;
}
 
var MapSprite = function (spriteType, id) {
    this.spriteType = spriteType;
    this.id = id;
}

// TODO: Make parent - Sprite - that covers all players, NPCs, and enemies
function Player(socket, playerData) {
    this.socket = socket;
    this.id = playerData.id;
    this.name = playerData.name;
    this.gridPos = playerData.gridPos;
    this.dir = playerData.dir;
    this.mapData = new MapSprite(Consts.spriteTypes.PLAYER, this.id);

    map[playerData.gridPos.x][playerData.gridPos.y] = this.mapData;
    Map.ChangeCell(this.gridPos, this.mapData);

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
            cellValue: map[cell.x][cell.y]
        });
    });

    // TODO: For everything related to neighbors, account for reaching the edge of the screen and being out of bounds!!
    socket.on("ReqNeighborValue", function (cellDiff) {
        socket.emit("RecCellValue", {
            gridX: player.gridPos.x + cellDiff.x,
            gridY: player.gridPos.y + cellDiff.y,
            cellValue: map[player.gridPos.x + cellDiff.x][player.gridPos.y + cellDiff.y]
        });
    });

    socket.on("ReqMoveToCell", function (dirData) {
        var newX = player.gridPos.x + dirData.cellDiff.x;
        var newY = player.gridPos.y + dirData.cellDiff.y;

        if (map[newX][newY] != mapTileIndicies['water']) {  
            return;
        }        

        // Tell old neighbors about move out
        Map.ChangeCell(player.gridPos, mapTileIndicies['water']);
        // Tell new neighbors about move in
        Map.ChangeCell({ x: newX, y: newY }, player.mapData);
        // Update own position
        player.UpdateMove(newX, newY, Consts.dirImg[dirData.key]);

        player.UpdateNeighbors();
        socket.emit("RecMoveToCell", player.GetMoveData());
    });

    socket.on("UpdatePixelPos", function (updatePack) {
        sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id] = updatePack;
    });

    socket.on("MsgToServer", function (data) {
        var escapedMsg = validator.escape(data["msg"]);
        io.emit("MsgToClient", { msg: escapedMsg });
    });
}
Player.prototype.UpdateMove = function (x, y, dir) {
    this.gridPos.x = x;
    this.gridPos.y = y;
    this.dir = dir;
};
Player.prototype.GetMoveData = function() {
    return {
        x: this.gridPos.x,
        y: this.gridPos.y,
        dir: this.dir
    };
}
Player.prototype.UpdateNeighbors = function () {
    // Get new neighbors
    this.neighbors.left = map[this.gridPos.x - 1][this.gridPos.y];
    this.neighbors.right = map[this.gridPos.x + 1][this.gridPos.y];
    this.neighbors.up = map[this.gridPos.x][this.gridPos.y - 1];
    this.neighbors.down = map[this.gridPos.x][this.gridPos.y + 1];
    
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

// 2D array covering all tiles, persistently tracking all sprites (players [nav and tubbs], enemies, etc.)
/* 
 * 0 = unoccupied
 * 
 * { player: id
 * { npc: id? name?
 * { enemy: id? name?
 */

var map = [];
// var spawnPoints = [
//     { x: 1, y: 1},
//     { x: 2, y: 1},
//     { x: 3, y: 1},
//     { x: 4, y: 1},
//     { x: 5, y: 1}, 
//     { x: 1, y: 2},
//     { x: 2, y: 2},
//     { x: 3, y: 2},
//     { x: 4, y: 2},
//     { x: 5, y: 2}
// ];
var spawnPoints = [
    { x: 46, y: 49},
    { x: 47, y: 49},
    { x: 48, y: 49},
    { x: 49, y: 49},
    { x: 50, y: 49}, 
    { x: 46, y: 50},
    { x: 47, y: 50},
    { x: 48, y: 50},
    { x: 49, y: 50},
    { x: 50, y: 50}
];

// TODO: Get tile data dynamically
//mapJSONData.layers[0].data
for (var i = 0; i < mapJSONData.layers[0].width; i++) {
    map[i] = [];
    for (var j = 0; j < mapJSONData.layers[0].height; j++) {
        var col = j * mapJSONData.layers[0].width;
        map[i][j] = mapJSONData.layers[0].data[col + i];
    }
}

var Map = {
    ChangeCell: function (cell, value) {
        // Set the player at the current map position
        map[cell.x][cell.y] = value;

        // Update any potentially new neighbors of this map call that they also have a new neighbor.
        var mapData = map[cell.x - 1][cell.y];
        if (mapData.spriteType)
            sprites.allData[mapData.spriteType][mapData.id].UpdateNeighbor('right', value);

        mapData = map[cell.x + 1][cell.y];
        if (mapData.spriteType)
            sprites.allData[mapData.spriteType][mapData.id].UpdateNeighbor('left', value);

        mapData = map[cell.x][cell.y - 1];
        if (mapData.spriteType)
            sprites.allData[mapData.spriteType][mapData.id].UpdateNeighbor('down', value);

        mapData = map[cell.x][cell.y + 1];
        if (mapData.spriteType)
            sprites.allData[mapData.spriteType][mapData.id].UpdateNeighbor('up', value);
    }
}

module.exports = function(dbHdlr) {

    return {
        InitSocketCalls: function (io, socket) {

            socket.on("ReqWorldInitData", async function () {

                var orientObj = {};

                // Check database first, and only use a random spawn point if they don't have save data to use.
                // Sign-in ahead of this call will populate socketID field in db, allowing check here to work.
                var dbPlayer = await dbHdlr.GetPlayerData(socket.client.id);
                if(dbPlayer && dbPlayer["orientation"]) {
                    orientObj = dbPlayer["orientation"];
                }
                else {
                    // Get a spawn point
                    var spawnIndex = 0;
                    for (var i = 0; i < spawnPoints.length; i++) {
                        if (map[spawnPoints[i].x][spawnPoints[i].y] == mapTileIndicies['water']) {
                            spawnIndex = i;
                            // The player has not yet been created, so just set to -1 for now.
                            map[spawnPoints[i].x][spawnPoints[i].y] = -1;
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
                    socket.broadcast.emit("RemoveSprite", player.mapData);

                    // Take player off the map
                    map[player.gridPos.x][player.gridPos.y] = mapTileIndicies['water'];
                    
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