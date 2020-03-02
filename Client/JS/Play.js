
var playState = (function() {

    var deltaTime = 0.0;

    var map,
        layer;

    var player;
    
    var sprites = {
        player: {},
        NPC: {},
        enemy: {},
    }

    return {
        init: function (data) {
            //------------------------ MAP
            
            map = game.add.tilemap('tilemap');
            map.addTilesetImage('tilesetPH', 'tileset');
            layer = map.createLayer('Tile Layer 1');
            layer.resizeWorld();
            
            
            // TODO: Get the amount of tiles dynamically for this, instead of just putting 100.
            game.world.setBounds(0, 0, Constants.TILE_SIZE * 100, Constants.TILE_SIZE * 100);
            
            /*
            map.setCollision(1);

            function testCallback() {
                console.log('Colliding with the ground.');
            }

            map.setTileIndexCallback(1, testCallback, this);
            */

            player = new LocalPlayer(
                { x: data.gridSpawn.x, y: data.gridSpawn.y }, 
                'navBoatRight', 
                menuState.GetDispName(),
                Network.GetSocketID()
            );
        },
        preload: function () {
            
            // For some very odd reason, this CANNOT be in init(), or it will not work. \_(O.o)_/
            game.camera.follow(player);
            
            //------------------------ SETUP NETWORK CALLS

            // First emission sent from server - assign proper id, setup map, etc.
            Network.CreateResponse("GetServerGameData", function (data) {
                for (let i = 0; i < data.sprites.length; i++) {
                    // TODO: Include direction
                    sprites[data.sprites[i].type][data.sprites[i].id] = new NetSprite({ x: data.sprites[i].pixelPos.x, y: data.sprites[i].pixelPos.y }, 'navBoatRight', data.sprites[i].name, data.sprites[i].id);
                }
            });

            // and tell everyone else about player. Adding new players after this player has joined
            Network.CreateResponse("AddNewPlayer", function (playerData) {
                sprites['player'][playerData.id] = new NetSprite({ x: playerData.pixelPos.x, y: playerData.pixelPos.y }, 'navBoatRight', playerData.name, playerData.id);
            });

            // CHECK STORAGE INFO, databse info, etc. Send everything necessary to server to pass to others
            Network.Emit("Play", { initPack: player.GetInitPack(), updatePack: player.GetUpdatePack() });

            //------------------------ ALL OTHER NETWORK CALLS

            // Update all info (map, players, etc. as needed);
            Network.CreateResponse("UpdateFromServer", function (serverSpriteUpdates) {
                // Use this format to exclude player without needing additional checks
                // TODO: Maybe make this safer? Make sure there is never a mismatch between sprite lists...
                for (var type in sprites) {
                    for (var id in sprites[type]) {
                        // Get their image info, tubb info, etc. Need to create the full object at least visually.
                        if (serverSpriteUpdates[type][id])
                            sprites[type][id].ServerUpdate(serverSpriteUpdates[type][id]);
                        else
                            console.log("Tried to update non-existant " + type + ", id: " + id);
                    }
                }
            });

            // Remove any sprite, including players
            function RemoveSpriteCallback(mapSprite) {
                // TODO: Other removal things as needed (exit animation for players? Handle any world interactions/events/etc.)
                if (sprites[mapSprite.spriteType][mapSprite.id]) {
                    sprites[mapSprite.spriteType][mapSprite.id].destroy();
                    delete sprites[mapSprite.spriteType][mapSprite.id];
                }
                else {
                    // Incase "GetServerGameData" has not yet been called and player with that id has not yet been added to this client,
                    // Recursively call this function until it is done.
                    setTimeout(function () {
                        RemoveSpriteCallback(mapSprite);
                    } , 250);
                }
            }
            Network.CreateResponse("RemoveSprite", RemoveSpriteCallback);
            
            function MoveSpriteCallback(moveData) {
                // TODO: Other removal things as needed (exit animation for players? Handle any world interactions/events/etc.)
                if (sprites[moveData.mapData.spriteType][moveData.mapData.id]) {
                    sprites[moveData.mapData.spriteType][moveData.mapData.id].MoveTo(moveData.cell, moveData.dir);
                }
                else {
                    // Incase "GetServerGameData" has not yet been called and player with that id has not yet been added to this client,
                    // Recursively call this function until it is done.
                    setTimeout(function () {
                        MoveSpriteCallback(moveData);
                    } , 500);
                }
            }
            Network.CreateResponse("MoveNetSprite", MoveSpriteCallback);
        },
        create: function () { // PRELOAD SERVER FUNCTIONS STILL RUNNING WHILE CREATE AND UPDATE ARE CALLED
            game.input.onDown.add(function (pointer) {
                var worldX = game.camera.x + pointer.x,
                    worldY = game.camera.y + pointer.y;
                
                var cellX = (worldX - (worldX % Constants.TILE_SIZE)) / Constants.TILE_SIZE,
                    cellY = (worldY - (worldY % Constants.TILE_SIZE)) / Constants.TILE_SIZE;
                
                // Response is in Gameobjects.js
                Network.Emit("GetCellValue", { x: cellX, y: cellY });
                console.log("Click pixelPos x: " + worldX + ", y: " + worldY);
                console.log("Click gridPos x: " + cellX + ", y: " + cellY);
                console.log("Click tile: " + map.getTile(cellX, cellY, layer).index);
            });
            
            /*
            function PseudoUpdate() {
                player.Update();
                for (var type in sprites) {
                    for (var id in sprites[type])
                        sprites[type][id].Update();
                }
            }
            setInterval(PseudoUpdate, 1000/60)
             */

        },
        update: function () { // PRELOAD SERVER FUNCTIONS STILL RUNNING WHILE CREATE AND UPDATE ARE CALLED
            
            // Maybe just go by frames, cause this timing is fairly crazy, and I don't think it's the right calculation anyway
            //deltaTime = (game.time.elapsedMS * game.time.fps) * 0.001;
            player.Update();
            for (var type in sprites) {
                for (var id in sprites[type])
                    sprites[type][id].Update();
            }
        },
        render: function () {
            game.debug.cameraInfo(game.camera, 32, 32);
            game.debug.spriteCoords(player, 320, 32);
        },
        gameOver: function () {
            game.state.start('end');
        }
    }
})();