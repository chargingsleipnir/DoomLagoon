
var endState = ( function () {
    
    return {
        create: function () {
            game.add.text(80, 80, 'Game ended somehow', { font: '50px Arial', fill: '#ffffff' });
            game.add.text(80, game.world.height - 80, 'Press S to start over', { font: '25px Arial', fill: '#ffffff' });
            var sKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
            sKey.onDown.addOnce(this.restart, this);
        },
        restart: function () {
            game.state.start('play');
        },
        close: function () {

        }
    }
})();