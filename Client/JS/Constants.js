const Constants = {
    DISP_NAME_STYLE: { font: "16px Arial", fill: "#FFFFFF" },
    TILE_SIZE: 32,
    DIR_MOVE: {
        LEFT: new Phaser.Geom.Point(-1, 0),
        RIGHT: new Phaser.Geom.Point(1, 0),
        UP: new Phaser.Geom.Point(0, -1),
        DOWN: new Phaser.Geom.Point(0, 1)
    },
    DIR_IMG: {
        LEFT: 0,
        RIGHT: 1,
        UP: 2,
        DOWN: 3
    }
}