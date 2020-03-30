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
        nextGridPos;
        pixelPosActive;
        pixelPosFrom;
        pixelPosTo;

        isMoving;
        moveDist;
        moveFracCovered;
        MOVE_COOLDOWN = 2;

        hp;
        strength;
        deathCooldown;

        constructor(enemySpawnObj) {
            enemySpawnObj.id = enemyID;
            enemyID++;
            // Not set in Tiled - no real need to be
            enemySpawnObj.dir = Consts.dirIndex.DOWN;

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
            this.nextGridPos = this.gridPos;
            this.pixelPosActive = {
                x: this.gridPos.x * mapData.GetTileWidth(),
                y: this.gridPos.y * mapData.GetTileHeight(),
            }
            
            this.pixelPosFrom = { x: -1, y: -1 };
            this.pixelPosTo = { x: -1, y: -1 };

            this.isMoving = false;
            this.moveDist = 0;
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

        Init() {
            super.Init();
            this.RunMoveTimer();
        }

        //* Gets called from Entity MoveToCell, upon RunMoveTimer's new position selection, so this is the perfect - if not entirely appropriate - place to update the next pixel-based coordinates
        UpdateMove(newPos, dir) {
            super.UpdateMove(newPos, dir);
            this.pixelPosTo.x = newPos.x * mapData.GetTileWidth();
            this.pixelPosTo.y = newPos.y * mapData.GetTileHeight();
        };

        GetUpdatePack() {
            return {
                x: this.pixelPosActive.x,
                y: this.pixelPosActive.y,
                dir: this.dir
            };
        }

        RunMoveTimer() {
            if(this.inBattle)
                return;

            var self = this;
            setTimeout(() => {
                var neighborKeyArr = [ "LEFT", "RIGHT", "UP", "DOWN" ];

                function RecurCheck_neighborKeyArr() {
                    if(neighborKeyArr.length > 0) {
                        var randIndex = Math.floor(Math.random() * neighborKeyArr.length);
                        if(self.neighbors[neighborKeyArr[randIndex]] != Consts.tileTypes.WALK) {
                            // Remove that direction and run it again.
                            neighborKeyArr.splice(randIndex, 1);
                            // Keep going till all are checked.
                            return RecurCheck_neighborKeyArr();
                        }
                        return randIndex;
                    }
                    else {
                        return -1;
                    }
                }
                var openTileIndex = RecurCheck_neighborKeyArr();
                if(openTileIndex == -1) {
                     // If none are good, restart entire 5 second timer from scratch.
                     console.log("Enemy has no tiles to move to.");
                     self.RunMoveTimer();
                }
                else {
                    var dir = Consts.dirIndex[neighborKeyArr[openTileIndex]];
                    this.pixelPosFrom.x = this.pixelPosActive.x;
                    this.pixelPosFrom.y = this.pixelPosActive.y;
                    self.MoveToCell(Consts.dirDiff[dir]);
                    self.isMoving = true;
                }
            }, self.MOVE_COOLDOWN * 1000)
        }

        // Pick a random neighbor that can be walked to, walk there, and wait for the moveCooldown before doing so again.
        Update() {
            if(!this.isMoving)
                return;

            if (this.moveFracCovered == 0.0) {
                // TODO: Change direction? This should probably be changed wherever the isMoving flag was toggled on.
            }

            this.moveDist += Consts.MAP_MOVE_SPEED;
            this.moveFracCovered = this.moveDist / mapData.GetTileWidth();

            if(this.moveFracCovered < 1.0) {
                // Lerp
                var diffX = (this.pixelPosTo.x - this.pixelPosFrom.x) * this.moveFracCovered;
                var diffY = (this.pixelPosTo.y - this.pixelPosFrom.y) * this.moveFracCovered;
                this.pixelPosActive.x = this.pixelPosFrom.x + diffX;
                this.pixelPosActive.y = this.pixelPosFrom.y + diffY;
                sprites.updatePack[Consts.spriteTypes.ENEMY][this.id] = this.GetUpdatePack();
            }
            else {
                this.pixelPosFrom.x = this.pixelPosActive.x = this.pixelPosTo.x;
                this.pixelPosFrom.y = this.pixelPosActive.y = this.pixelPosTo.y;
                sprites.updatePack[Consts.spriteTypes.ENEMY][this.id] = this.GetUpdatePack();

                this.moveDist = 0.0;
                this.moveFracCovered = 0.0;

                this.isMoving = false;
                this.RunMoveTimer();
            }
        }
    }

    return {
        // TODO: In tiled, enemy spawn points will need to hold more info (just another enum) about the type of enemy.
        PopulateSpawnPoints: () => {
            mapData.GetEnemySpawns().forEach(enemySpawnObj => {
                var enemy = new Enemy(enemySpawnObj);
                enemy.Init();
                enemies.push(enemy);
            });

            return enemies;
        }
    }
}