(function(exports){

    exports.DISP_NAME_STYLE = { font: "16px Arial", fill: "#FFFFFF" };
    exports.dirImg = { LEFT: 0, RIGHT: 1, UP: 2, DOWN: 3 };
    exports.spriteTypes = { PLAYER: 0, ENEMY: 1, NPC: 2 };
    exports.enemyTypes = { KNIGHT_AXE_RED: 0 };
    exports.moveCacheSlots = { FROM: 0, TO: 1, NEXT: 2 };
    exports.spawnTypes = { PLAYER: 0, ENEMY: 1, NPC: 2 };

    exports.tileTypes = { BLOCK: 0, WALK: 1, SIGN: 2, SPRING: 3, CHEST: 4, CAVERN: 5 };
    exports.chestTypes = { EQUIPMENT: 0, ABILITY: 1 };
    exports.equipmentUpgrades = { FIGHTER: 0, LORD: 1, KNIGHT: 2 };
    exports.abilityUpgrades = { INIT: 0, LEVEL1: 1, LEVEL2: 2 };
    // If both server and client read the same map data independently, perhaps nothing needs to be noted here?

    exports.SALT_ROUNDS = 10;
    exports.CHAT_LOG_SIZE = 50;

})(typeof exports === 'undefined' ? this['Consts'] = {} : exports);