//var entity = require('./Entity.js')();

var mapData = require('./MapDataReader.js')();
var Consts = require('../Shared/Consts.js');

module.exports = function(sprites) {

    const entityModule = require('./Entity.js')(sprites);

    // Since I'll only be reusing a small amount of enemies, less than 100, this is as much as I need to do for their ids
    var enemyID = 100;
    var enemies = [];

    class Enemy extends entityModule.Entity {

        // TODO: deathCooldown property...
        // Just make a finite amount of enemies, amd have them "die", and re-animate at their given spawn point after the cooldown.

        type = -1;
        spawnPos;
        hp;
        strength;
        deathCooldown;

        constructor(enemySpawnObj) {
            enemySpawnObj.id = enemyID;
            enemyID++;
            // Not set in Tiled - no real need to be
            enemySpawnObj.dir = Consts.dirImg.DOWN;

            // Add the sub-typing into the cell data to reach the Client
            var enemyType = enemySpawnObj.props['enemyType'];
            enemySpawnObj.cellData = { 
                spriteType: Consts.spriteTypes.ENEMY,
                id: enemySpawnObj.id,
                enemyType: !isNaN(enemyType) ? enemyType : null
            };

            if(enemySpawnObj.cellData.enemyType == null)
                console.error("Some Enemy not given an enemy type in Tiled");

            super(enemySpawnObj);

            this.type = enemyType;
            this.spawnPos = this.gridPos;
            this.deathCooldown = 30; // Seconds

            //* This might be more than sufficient to distinguish among each type of enemy for such a limited game sample
            // TODO: If not, Give each enemy type it's own class, "extended" from an "Enemy" base class, With "Enemy Factory" a separate thing (file or class) that creates the derived classes based on the map data.
            switch(this.type) {
                case Consts.enemyTypes.KNIGHT_AXE_RED:
                    this.name = "KnightAxeRed";
                    this.hp = 100;
                    this.strength = 10;
                    break;
            }
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