class Battle extends SceneTransition {
    
    constructor() {
        super("Battle");
    }

    init(battleData) {
        console.log("INIT BATTLE WITH ENEMY: ", battleData.enemyID);
    }

    preload() {
        console.log("PRELOAD BATTLE WITH ENEMY");
    }

    create(battleData) {
        console.log("CREATE BATTLE WITH ENEMY: ", battleData.enemyID);
        var bg = this.add.image(Main.phaserConfig.width * 0.5, Main.phaserConfig.height * 0.5, 'battleBG_Grass_House_01');
        bg.setDisplaySize(Main.phaserConfig.width, Main.phaserConfig.height);

        var self = this;

        Network.CreateResponse("RecPlayerAction", (action) => {
            // TODO: Do everything graphically here. This could be my own actions, or one of the other players
            console.log(`Player ${action.socketID} acted. Enemy HP: ${action.enemyHP}`);
        });

        Network.CreateResponse('RecBattleWon', (data) => {
            Main.player.inBattle = false;
            
            console.log("Battle won!");
            Main.DispMessage("You won!", 2);
            Main.DispMessage("Got x exp!", 2);

            self.scene.sleep("Battle");
        });

        // TODO: Implement
        Network.CreateResponse("RecBattleLost", () => {
            
        });

        this.input.keyboard.on('keydown_ENTER', () => {
            // TODO: Do nothing graphically here, just send input/command
            Network.Emit("BattleAction");
        });

        // The "sys" is the scene itself I think, so this event can really be put anywhere.
        // TODO: I could potentitally setup the whole scene quiently in the background, putting it to sleep right away,
        // and only wake it up once the battles happen, including the first battle.
        // We'll see if that becomes necessary.
        this.events.on('wake', (sys, battleData) => {
            console.log("WAKE EVENT, BATTLE WITH ENEMY: ", battleData.enemyID)
        });
    }
}