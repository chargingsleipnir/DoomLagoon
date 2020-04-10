(function(exports){

    exports.DISP_NAME_STYLE = { font: "16px Arial", fill: "#FFFFFF" };
    exports.DISP_DAMAGE_STYLE = { font: "20px Arial", fill: "#ff0000", fontStyle: "strong" };
    
    exports.dirIndex = { LEFT: 0, RIGHT: 1, UP: 2, DOWN: 3 };
    exports.dirDiff = [
        { key: 'LEFT', cellDiff: { x: -1, y: 0 } },
        { key: 'RIGHT', cellDiff: { x: 1, y: 0 } },
        { key: 'UP', cellDiff: { x: 0, y: -1 } },
        { key: 'DOWN', cellDiff: { x: 0, y: 1 } }
    ];
    exports.cellDiff = { 
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 }
    };

    exports.spriteTypes = { PLAYER: 0, ENEMY: 1, NPC: 2 };
    exports.enemyAssetKeys = { 
        KNIGHT_AXE_RED: "KnightAxeRed"
    };
    exports.moveCacheSlots = { FROM: 0, TO: 1, NEXT: 2 };
    exports.spawnTypes = { PLAYER: 0, ENEMY: 1, NPC: 2 };
    exports.battleCommands = { FIGHT: 0, RUN: 1 }

    exports.depthExceptions = { TILEMAP_OVERLAP_LAYER: 9999 }

    exports.tileTypes = { BLOCK: 0, WALK: 1, SIGN: 2, SPRING: 3, CHEST: 4, CAVERN: 5 };
    exports.terrainTypes = { BRIDGE: 0 } // Grass, Sand, Dirt, etc...
    exports.chestTypes = { EQUIPMENT: 0, ABILITY: 1 };

    //* Although this could be player "assetKeys", keep this as numeric values here to use in calculating strength bonuses.
    exports.equipmentUpgrades = { FIGHTER: 0, LORD: 1, KNIGHT: 2 };
    exports.abilityUpgrades = { INIT: 0, LEVEL1: 1, LEVEL2: 2 };
    // If both server and client read the same map data independently, perhaps nothing needs to be noted here?

    exports.MAP_MOVE_SPEED = 2;
    exports.MAX_PLAYERS_PER_BATTLE = 3;
    exports.ENEMY_DEATH_COOLDOWN = 10;
    exports.BATTLE_WON_NEXT_COOLDOWN = 1;
    exports.BATTLE_RAN_NEXT_COOLDOWN = 4;

    exports.SALT_ROUNDS = 10;
    exports.CHAT_LOG_SIZE = 50;

    exports.INTERVAL_STEP = 1000 / 60;

})(typeof exports === 'undefined' ? this['Consts'] = {} : exports);