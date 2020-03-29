
var Consts = require('../Shared/Consts.js');
var JSON_Overworld = require('../Shared/DataFiles/OverworldTilesetsEmbeded.json');

var JSON_tilesets = {};
for(var i = 0; i < JSON_Overworld.tilesets.length; i++) {
    var setName = JSON_Overworld.tilesets[i].name;
    JSON_tilesets[setName] = JSON_Overworld.tilesets[i];
}

var playerSpawns = [];
var enemySpawns = [];
var mapObjectsByGridPos = [];
var signsByGridPos = [];
var chestsByGridPos = [];
var walkableMap = [];

// Read the data directly, at least just to make the work required on the various layers nicely explicit.

//* Terrain layer - Start by denoting every walkable cell here. (As the map currently is, just everything that isn't water.)
var waterTiles = JSON_tilesets["BaseWater"].tiles;
var waterTilesetIDs = [];
for (var i = 0; i < waterTiles.length; i++) {
    waterTilesetIDs.push(waterTiles[i].id + JSON_tilesets["BaseWater"].firstgid);
}
//console.log(waterTilesetIDs);

// var q = 0;
var layerObj = JSON_Overworld.layers[0];
for (var i = 0; i < layerObj.width; i++) {
    walkableMap[i] = [];
    for (var j = 0; j < layerObj.height; j++) {
        var col = j * layerObj.width;
        var value = layerObj.data[col + i];
        if(waterTilesetIDs.indexOf(value) == -1)
            walkableMap[i][j] = Consts.tileTypes.WALK;
        else
            walkableMap[i][j] = Consts.tileTypes.BLOCK;

        // q++;
        // if(q > 433)
        //     console.log(walkableMap[i][j]);
    }
}

//* Transparent tiles - Overlap any non-walkable tiles from this layer over the existing map data from the terrain loop.
// (Everything except the bridges, they need to convert an existing non-walkable cell into a walkable one)
var bridgeTiles = JSON_tilesets["Toppers"].tiles;
var bridgeTilesetIDs = [];
for (var i = 0; i < bridgeTiles.length; i++) {
    if(bridgeTiles[i].properties) {
        for (var j = 0; j < bridgeTiles[i].properties.length; j++) {
            if(bridgeTiles[i].properties[j].name == "Walkable") {
                if(bridgeTiles[i].properties[j].value) {
                    bridgeTilesetIDs.push(bridgeTiles[i].id + JSON_tilesets["Toppers"].firstgid);
                }
            }
            break;
        }
    }
}

//var p = 0;
var layerObj = JSON_Overworld.layers[1];
for (var i = 0; i < layerObj.width; i++) {
    for (var j = 0; j < layerObj.height; j++) {
        var col = j * layerObj.width;
        var value = layerObj.data[col + i];
        // No tile placed here at all, proceed through loop
        if(value == 0) {
            // p++;
            // if(p > 433)
            //      console.log(walkableMap[i][j]);
            continue;
        }
        else {
            // Value is not a bridge, so something blocking travel
            if(bridgeTilesetIDs.indexOf(value) == -1)
                walkableMap[i][j] = Consts.tileTypes.BLOCK;
            else
                walkableMap[i][j] = Consts.tileTypes.WALK;
        }
        // p++;
        // if(p > 433)
        //     console.log(walkableMap[i][j]);
    }
}

//* Object layer - Get the coorinates occupied by every object, overlap the walkable cell data from previous loops, and set interactable object data (treasure chests, etc.) on map.
var layerObj = JSON_Overworld.layers[3];
for(var i = 0; i < layerObj.objects.length; i++) {
    var obj = layerObj.objects[i];

    if(obj.point) {
        var gridPos = {
            x: obj.x / JSON_Overworld.tilewidth,
            y: obj.y / JSON_Overworld.tileheight
        }
        if(obj.type == Consts.spawnTypes.PLAYER) {
            playerSpawns.push(gridPos);
        }
        else if(obj.type == Consts.spawnTypes.ENEMY) {
            var spawnObj = {
                gridPos: gridPos,
                props: {}
            }
            for(var j = 0; j < obj.properties.length; j++) {
                spawnObj.props[obj.properties[j].name] = obj.properties[j].value;
            }

            enemySpawns.push(spawnObj);
        }
    }
    else {
        var xLoops = obj.width / JSON_Overworld.tilewidth;
        var yLoops = obj.height / JSON_Overworld.tileheight;

        // "gridY": subtracting the object height because the pivot point for Tiled tile-based objects is in the bottom-left. This will make it as though it's in the top-left.
        for(var x = 0; x < xLoops; x++) {
            for(var y = 0; y < yLoops; y++) {
                var mapObj = {
                    gridX: (obj.x + (JSON_Overworld.tilewidth * x)) / JSON_Overworld.tilewidth,
                    gridY: ((obj.y + (JSON_Overworld.tileheight * y)) - obj.height) / JSON_Overworld.tileheight,
                    type: obj.type
                };

                mapObjectsByGridPos.push(mapObj);
                walkableMap[mapObj.gridX][mapObj.gridY] = obj.type;

                // Individualize object types and include custom properties where relevant.
                if(obj.type == Consts.tileTypes.SIGN) {
                    mapObj["props"] = {};
                    for(var z = 0; z < obj.properties.length; z++) {
                        mapObj["props"][obj.properties[z].name] = obj.properties[z].value;
                    }
                    signsByGridPos.push(mapObj);
                }
                else if(obj.type == Consts.tileTypes.CHEST) {
                    mapObj["props"] = {};
                    for(var z = 0; z < obj.properties.length; z++) {
                        mapObj["props"][obj.properties[z].name] = obj.properties[z].value;
                    }
                    chestsByGridPos.push(mapObj);
                }
            }
        }
    }
}

// Purely for testing!
// var r = 0;
// for (var i = 0; i < walkableMap.length; i++) {
//     for (var j = 0; j < walkableMap[i].length; j++) {
//         r++;
//         if(r > 483)
//             console.log(walkableMap[i][j]);
//     }
// }

// TODO: All walkable area seems to be covered, now implement new map data!

module.exports = function() {

    return {
        GetObjectDataByGridPos: () => {
            return mapObjectsByGridPos;
        },
        GetSignMessage: (gridPos) => {
            for (var i = 0; i < signsByGridPos.length; i++) {
                if(signsByGridPos[i].gridX == gridPos.x && signsByGridPos[i].gridY == gridPos.y) {
                    return signsByGridPos[i]["props"]["Message"];
                }
            }
        },
        GetChestContents: (gridPos) => {
            for (var i = 0; i < chestsByGridPos.length; i++) {
                if(chestsByGridPos[i].gridX == gridPos.x && chestsByGridPos[i].gridY == gridPos.y) {
                    return {
                        chestType: chestsByGridPos[i]["props"]["chestType"],
                        upgrade: chestsByGridPos[i]["props"]["upgrade"]
                    };
                }
            }
        },
        GetPlayerSpawns: () => {
            return playerSpawns;
        },
        GetEnemySpawns: () => {
            return enemySpawns;
        },
        GetWalkableTileMap: () => {
            return walkableMap;
        },
        SetValue: (cell, value) => {
            walkableMap[cell.x][cell.y] = value;
        },
        GetValue: (cell) => {
            return walkableMap[cell.x][cell.y];
        },
        GetValueXY: (cellX, cellY) => {
            return walkableMap[cellX][cellY];
        },
        GetValueOffset: (cell, offsetX, offsetY) => {
            return walkableMap[cell.x + offsetX][cell.y + offsetY];
        },
        GetTileWidth: () => {
            return JSON_Overworld.tilewidth;
        },
        GetTileHeight: () => {
            return JSON_Overworld.tileheight;
        }
    }
}