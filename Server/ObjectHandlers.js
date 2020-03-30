var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

// TODO: Battle handler/logic

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

var playerModule = require('./Player.js')(sprites);
var enemiesModule = require('./Enemies.js')(sprites);

// One-time set up enemies
var enemyList = enemiesModule.PopulateSpawnPoints();

enemyList.forEach(enemy => {
    sprites.allData[Consts.spriteTypes.ENEMY][enemy.id] = enemy;
    sprites.updatePack[Consts.spriteTypes.ENEMY][enemy.id] = enemy.GetUpdatePack();
});

module.exports = function(dbHdlr) {

    return {
        InitSocketCalls: (io, socket) => {

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
                        dir: Consts.dirIndex.DOWN
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
                var player = new playerModule.Player(socket, playerData.initPack);
                player.Init();

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
        GetUpdatePack: () => {
            return sprites.updatePack;
        },
        Update: () => {
            enemyList.forEach(enemy => {
                enemy.Update();
            });
        }
    }
}