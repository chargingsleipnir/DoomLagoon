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
        PassIoObj: (io) => {
            mapData.SetIoObjs(io);

            enemyList.forEach(enemy => {
                enemy.SetIoObj(io);
            });
        },
        InitSocketCalls: (io, socket) => {
            socket.on("ReqBuildPlayer", async function (initData) {
                // TAG: Save location disabled
                // Well I can still save the locations, I'm just not loading them right now.
                // I'd rather use the spawn points until it's worth the time to develop a check for the saved coordinates
                // actually being safe(unoccupied) to start on, and if not, check neighboring points recursively until a safe point is found.

                //* Set up this player first
                var orientObj = {};
                var upgradeObj = {
                    equip: Consts.equipmentUpgrades.FIGHTER,
                    ability: Consts.abilityUpgrades.INIT
                };

                // Check database first
                // Sign-in ahead of this call will populate socketID field in db, allowing check here to work.
                var dbPlayer = await dbHdlr.GetPlayerData(socket.client.id);
                if(dbPlayer) {
                    if(dbPlayer["upgrades"])
                        orientObj = dbPlayer["orientation"];
                    if(dbPlayer["upgrades"])
                        upgradeObj = dbPlayer["upgrades"];
                }
                // If database isn't being used, use local storage if an object was sent up.
                else if(initData.localStorage != null) {
                    orientObj = initData.localStorage.orientation;
                    upgradeObj = initData.localStorage.upgrades;
                }
                // Otherwise, create spawn point
                else {

                }
                // TAG: Save location disabled
                // TODO: Move this back into the "else" statement once I've committed to loading position data.


                if(orientObj.x == -1) {
                    // TODO: If I return to saving & loading position data, need to account for this.
                    // TODO: Both database and local storage initial setting will save default upgrades, but no posiiton to speak of, hence starting as -1
                    // TODO: So inital spawn point needs to be used in this case!
                }

                // ==================================================== FROM HERE
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
                dbHdlr.SaveObjects(socket.client.id, orientObj, upgradeObj);
                // ==================================================== TO HERE

                // Player's been created, update their neighbors list right away, as this will always determine what their next move can be locally.
                var player = new playerModule.Player(socket, {
                    id: socket.client.id,
                    name: initData.dispName,
                    gridPos: { x: orientObj.x, y: orientObj.y },
                    dir: orientObj.dir,
                    upgrades: upgradeObj
                });

                player.Init();

                // Set up all other network responses
                player.SetupNetworkResponses(io, socket);

                // Add player to lists
                sprites.allData[Consts.spriteTypes.PLAYER][socket.client.id] = player;
                sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id] = {
                    x: orientObj.x * mapData.GetTileWidth(),
                    y: orientObj.y * mapData.GetTileHeight(),
                    dir: orientObj.dir
                };
                // Send new player data to all other players
                socket.broadcast.emit("AddNewPlayer", player.GetInitPack());

                socket.emit("RecBuiltPlayer", {
                    orientation: orientObj,
                    upgrades: upgradeObj,
                    assetKey: player.assetKey
                });
            });

            socket.on("Play", function () {
                // TODO: Maybe make this perpetually up-to-date with all sprites, and only packs grabbed when needed, so it doesn't need to be recreated each time.
                var spriteInitPack = []
                for (var type in sprites.allData)
                    for (var id in sprites.allData[type])
                        if(id != socket.client.id) // Exclude myself
                            spriteInitPack.push(sprites.allData[type][id].GetInitPack());
                
                socket.emit("GetServerGameData", { sprites: spriteInitPack });
            });

            // Not a user-made function
            socket.on("disconnect", function () {
                console.log(`Socket connection removed: ${socket.client.id} `);
                
                var player = sprites.allData[Consts.spriteTypes.PLAYER][socket.client.id];
                                
                if (player) {
                    dbHdlr.SaveAndExit(socket.client.id,
                        { x: player.gridPos.x, y: player.gridPos.y, dir: player.dir }, 
                        { equip: player.equipLevel, ability: player.abilityLevel }
                    );

                    player.Disconnect();

                    // Take player off the map
                    mapData.SetValue(player.gridPos, Consts.tileTypes.WALK);

                    socket.broadcast.emit("RemoveMapSprite", player.mapSprite);
                    
                    // Remove player from server
                    delete sprites.allData[Consts.spriteTypes.PLAYER][socket.client.id];
                    delete sprites.updatePack[Consts.spriteTypes.PLAYER][socket.client.id];
                }
                else {
                    dbHdlr.SaveAndExit(socket.client.id, null, null);
                }
            });
        },
        GetUpdatePack: () => {
            return sprites.updatePack;
        },
        Update: () => {
            // var playersObj = sprites.allData[Consts.spriteTypes.PLAYER];
            // Object.keys(playersObj).forEach((key) => {
            //     playersObj[key].Update();
            // })

            enemyList.forEach(enemy => {
                enemy.Update();
            });
        }
    }
}