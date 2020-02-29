//var validator = require('validator');
var mapJSONData = require('../Shared/DataFiles/mapPH.json'); // Automatic proper parsing!

/*
const MAX_SPEED = 10;

function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

var Entity = function (position) {
    var self = {
        pos: new Point(position.x, position.y),
        dir: new Point(),
    }

    self.Update = function () {
    }

    return self;
}

var Player = function (playerData) {
    var self = new Entity(playerData);

    if (playerIDReuseList.length > 0)
        self.id = playerIDReuseList.pop();
    else
        self.id = playerID++;

    var SuperUpdate = self.Update;
    self.Update = function () {

        // Update as needed?? This might just be gone.

        SuperUpdate();
    }

    self.GetInitPack = function () {
        return {
            id: self.id,
            pos: { x: self.pos.x, y: self.pos.y }
        };
    }
    self.GetUpdatePack = function () {
        return {
            id: self.id,
            pos: { x: self.pos.x, y: self.pos.y }
        };
    }

    return self;
}
Player.list = [];
Player.OnConnect = function (playerData, socket) {
    var player = new Player(playerData);

    socket.on("PosUpdate", function (dataPos) {
        player.pos.x = data.x;
        player.pos.y = data.y;
    });

    socket.on("CanvasClick", function (data) {
        var deltaX = data["x"] - player.pos.x;
        var deltaY = data["y"] - player.pos.y;
        var angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        CannonBall(player.colour, player.pos.x, player.pos.y, angle);
    });

    socket.emit("GetServerID", player.id); // MAYBE, IF NECESSARY

    // Should this not be io.emit? Does it always just automatically send to everyone?
    /*
    socket.emit("Init", {
        player: Player.GetInitPacks(),
        cannonBall: CannonBall.GetInitPacks()
    });

    return player;
}
Player.GetInitPacks = function () {
    var players = [];
    for (var i in Player.list)
        players.push(Player.list[i].GetInitPack());

    return players;
}
Player.OnDisconnect = function (player) {
    playerIDReuseList.push(player.id);
    removePack.player.push(player.id);
    delete Player.list.splice(Player.list.indexOf(player), 1);
}
Player.Update = function () {
    var pack = [];
    for (var i in Player.list) {
        Player.list[i].Update();
        pack.push(Player.list[i].GetUpdatePack());
    }
    return pack;
}
*/
 
var MapSprite = function (spriteType, id) {
    this.spriteType = spriteType;
    this.id = id;
}

// TODO: Make parent - Sprite - that covers all players, NPCs, and enemies
function Player(socket, playerData) {
    this.socket = socket;
    this.id = playerData.id;
    this.name = playerData.name;
    this.pixelPos = playerData.pixelPos;
    this.gridPos = playerData.gridPos;
    this.dir = playerData.dir;
    this.mapData = new MapSprite('player', this.id);

    map[playerData.gridPos.x][playerData.gridPos.y] = this.mapData;

    Map.ChangeCell(this.gridPos, this.mapData);
    this.neighbors = {};
    this.GetNeighbors();
}
Player.prototype.SetupNetworkResponses = function (io, socket) {
    
    var that = this;

    // JUST FOR TESTING - TODO: EXPAND SERVER TESTING FUNCTIONS
    socket.on("GetCellValue", function (cell) {
        socket.emit("CellValueRes", map[cell.x][cell.y]);
    });
    
    socket.on("MoveToCell", function (moveData) {
        // TODO: This DOES NOT handle the edges off the map (outside of the array)
        if (map[moveData.nextCell.x][moveData.nextCell.y] == 0) {            
            // Make sure not to inadvertantly set one of this player's own neighbors to itself
            map[that.gridPos.x][that.gridPos.y] = 0;
            // Tell new neighbors about move in
            Map.ChangeCell(moveData.nextCell, that.mapData);
            // Tell old neighbors about move out
            Map.ChangeCell(that.gridPos, 0);
            // Update own position
            that.gridPos.x = moveData.nextCell.x;
            that.gridPos.y = moveData.nextCell.y;
            
            that.GetNeighbors();

            socket.emit("ConfirmMove");
        }
        else {
            // Send back error and reverse course (this should rarely/never happen, but is a safety fallback
            that.UpdateNeighbor(moveData.dir, map[moveData.nextCell.x][moveData.nextCell.y])
            socket.emit("CancelMove");
        }
    });
    
    socket.on("UpdateMoveToServer", function (playerUpdatePack) {
        sprites.allData['player'][socket.client.id].UpdateMove(playerUpdatePack);
        sprites.updatePack['player'][socket.client.id] = playerUpdatePack;
    });
    
    // Not a user-made function
    socket.on("disconnect", function () {
        if (sprites.allData['player'][socket.client.id]) {
            socket.broadcast.emit("RemoveSprite", that.mapData);

            //socket.emit(""); SEND ONE OTHER SHUTDOWN FUNCTION AS NEEDED?? MAYBE GAME SAVE.

            // Take player off the map
            map[sprites.allData['player'][socket.client.id].gridPos.x][sprites.allData['player'][socket.client.id].gridPos.y] = 0;
            
            // Remove player from server
            delete sprites.allData['player'][socket.client.id];
            delete sprites.updatePack['player'][socket.client.id];
        }
    });
    
    socket.on("MsgToServer", function (data) {
        var escapedMsg = validator.escape(data["msg"]);
        io.emit("MsgToClient", { msg: escapedMsg });
    });
}
Player.prototype.UpdateMove = function (updatePack) {
    this.pixelPos.x = updatePack.pixelPos.x;
    this.pixelPos.y = updatePack.pixelPos.y;
    this.dir = updatePack.dir;
};
Player.prototype.GetNeighbors = function () {
    // Get new neighbors
    this.neighbors.l = map[this.gridPos.x - 1][this.gridPos.y];
    this.neighbors.r = map[this.gridPos.x + 1][this.gridPos.y];
    this.neighbors.u = map[this.gridPos.x][this.gridPos.y - 1];
    this.neighbors.d = map[this.gridPos.x][this.gridPos.y + 1];
    
    // TODO: Change this to just give full data? Save on checks, but adds more data transfer
    this.socket.emit('UpdateNeighbors', {
        l: this.neighbors.l == 0 ? 0:1,
        r: this.neighbors.r == 0 ? 0:1,
        u: this.neighbors.u == 0 ? 0:1,
        d: this.neighbors.d == 0 ? 0:1
    });
}
// Recieve new neighbor. TODO: Maybe send back more complicated occupancy data? Maybe not necessary.
Player.prototype.UpdateNeighbor = function (side, occupancy) {
    this.neighbors[side] = occupancy;
    this.socket.emit('UpdateNeighbor', { side: side, occupancy: occupancy == 0 ? 0:1 });
};
Player.prototype.GetInitPack = function () {
    return {
        type: this.mapData['spriteType'],
        id: this.id,
        name: this.name,
        pixelPos: this.pixelPos,
        dir: this.dir        
    }
}
Player.prototype.GetUpdatePack = function () {
    return {
        pixelPos: this.pixelPos,
        dir: this.dir        
    }
}

// Tracking the data of every sprite obj in the game
var sprites = {
    allData: {
        player: {},
        NPC: {},
        enemy: {}
    },
    updatePack: {
        player: {},
        NPC: {},
        enemy: {}
    }
}

// 2D array covering all tiles, persistently tracking all sprites (players [nav and tubbs], enemies, etc.)
/* 
 * 0 = unoccupied
 * 
 * { player: id
 * { npc: id? name?
 * { enemy: id? name?
 */

var map = [];
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
        if (mapJSONData.layers[0].data[col + i] == 1)
            map[i][j] = 1;
        else
            map[i][j] = 0;
    }
}

// TODO: Make this
var MapTemp = (function () {

})();
var Map = {
    ChangeCell: function (cell, value) {
        map[cell.x][cell.y] = value;
        if (map[cell.x - 1][cell.y].spriteType)
            sprites.allData[map[cell.x - 1][cell.y].spriteType][map[cell.x - 1][cell.y].id].UpdateNeighbor('r', value);
        if (map[cell.x + 1][cell.y].spriteType)
            sprites.allData[map[cell.x + 1][cell.y].spriteType][map[cell.x + 1][cell.y].id].UpdateNeighbor('l', value);
        if (map[cell.x][cell.y - 1].spriteType)
            sprites.allData[map[cell.x][cell.y - 1].spriteType][map[cell.x][cell.y - 1].id].UpdateNeighbor('d', value);
        if (map[cell.x][cell.y + 1].spriteType)
            sprites.allData[map[cell.x][cell.y + 1].spriteType][map[cell.x][cell.y + 1].id].UpdateNeighbor('u', value);
    }
}

module.exports = {
    InitSocketCalls: function (io, socket) {

        socket.on("RequestWorldData", function () {
            // Get a spawn point
            var spawnIndex;
            for (var i = 0; i < spawnPoints.length; i++) {
                if (map[spawnPoints[i].x][spawnPoints[i].y] == 0) {
                    spawnIndex = i;
                    map[spawnPoints[i].x][spawnPoints[i].y] = 1;
                    break;
                }
                // TODO: If none are available? Keep checking? Have way more? Overlap players? Hmmm....
            }
            
            // TODO: Get and send all other word init data

            socket.emit("WorldInitData", {
                gridSpawn: {
                    x: spawnPoints[spawnIndex].x, 
                    y: spawnPoints[spawnIndex].y
                }
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
            
            socket.emit("GetServerGameData", { sprites: spriteInitPack, mapState: null });
            
            // Add player to lists
            sprites.allData['player'][socket.client.id] = new Player(socket, playerData.initPack);
            sprites.updatePack['player'][socket.client.id] = playerData.updatePack;
            
            // Set up all other network responses
            sprites.allData['player'][socket.client.id].SetupNetworkResponses(io, socket);

            // Send new player data to all other players
            socket.broadcast.emit("AddNewPlayer", playerData.initPack);
        });
    },
    GetUpdatePack: function () {
        return sprites.updatePack;
    },
}