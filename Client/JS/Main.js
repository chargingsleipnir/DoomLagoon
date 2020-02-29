var Main = (function () {

    return {
        Init: () => {
            new Phaser.Game({
                type: Phaser.AUTO,
                width: 800,
                height: 600,
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 200 }
                    }
                },
                scene: [Title, Overworld, Battle]
            });
        }
    }
})();

