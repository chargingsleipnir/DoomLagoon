//var entity = require('./Entity.js')();

var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    const entityModule = require('./Entity.js')(sprites);

    // Since I'll only be reusing a small amount of enemies, less than 100, this is as much as I need to do for their ids
    var enemyID = 100;
    var enemies = [];

    class Enemy extends entityModule.Entity {

        // TODO: On top of strength, speed, etc, have a deathCooldown property.
        // Just make a finite amount of enemies, amd have them "die", and re-animate at their given spawn point after the cooldown.

        constructor(enemySpawnObj) {
            enemySpawnObj.id = enemyID;
            enemyID++;
            // Not set in Tiled - no real need to be
            enemySpawnObj.dir = Consts.dirImg.DOWN;

            enemySpawnObj.cellData = { 
                spriteType: Consts.spriteTypes.ENEMY,
                id: enemySpawnObj.id,
                enemyType: Consts.enemyTypes.KNIGHT_AXE_RED
            };

            super(enemySpawnObj);
        }

        GetUpdatePack() {
            return {
                x: this.gridPos.x * mapData.GetTileWidth(),
                y: this.gridPos.y * mapData.GetTileHeight(),
                dir: this.dir
            };
        }
    }

    return {
        // TODO: In tiled, enemy spawn points will need to hold more info (just another enum) about the type of enemy.
        PopulateSpawnPoints: () => {
            mapData.GetEnemySpawns().forEach(enemySpawnObj => {
                enemies.push(new Enemy(enemySpawnObj));
            });

            return enemies;
        }
    }
}