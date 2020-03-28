//var entity = require('./Entity.js')();

var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

var enemyID = 100;

function Enemy(enemySpawnData) {
    this.name = enemySpawnData.name;
    this.spawnPos = enemySpawnData.gridPos;
    this.gridPos = enemySpawnData.gridPos;
    this.dir = Consts.dirImg.DOWN;

    // TODO: On top of strength, speed, etc, have a deathCooldown property.
    // Just make a finite amount of enemies, amd have them "die", and re-animate at their given spawn point after the cooldown.

    this.mapSprite = mapData.GetMapSprite(Consts.spriteTypes.ENEMY, enemyID);
    enemyID++;

    //mapData.SetValue(this.gridPos, this.mapSprite);
}

module.exports = function(sprites) {
    var enemies = [];

    return {
        // TODO: In tiled, enemy spawn points will need to hold more info (just another enum) about the type of enemy.
        PopulateSpawnPoints: () => {
            mapData.GetEnemySpawns().forEach(element => {
                enemies.push(new Enemy(element));
            });
        }
    }
}