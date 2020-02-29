
var loadState = ( function () {
    
    return {
        preload: function () {
            // SPRITES
            game.load.image('navBoatLeft', 'Assets/Sprites/boatPH_Left.jpg');
            game.load.image('navBoatRight', 'Assets/Sprites/boatPH_Right.jpg');
            game.load.image('navBoatUp', 'Assets/Sprites/boatPH_Up.jpg');
            game.load.image('navBoatDown', 'Assets/Sprites/boatPH_Down.jpg');

            // MAP
            game.load.tilemap('tilemap', 'DataFiles/mapPH.json', null, Phaser.Tilemap.TILED_JSON);
            game.load.image('tileset', 'Assets/Map/tilesetPH.png');
        },
        create: function () {
            // Check local storage, databse info, etc. to pass to play state
            Network.CreateResponse("WorldInitData", function (data) {
                game.state.start('play', true, false, data);
            });
            Network.Emit("RequestWorldData");
        },
        update: function () {
        // show loading animation/message & image if required, then when done, go straight to play?
        }
    }
})();