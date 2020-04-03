class Battle extends SceneTransition {

    bg;

    menuCont;
    menuBG;

    LAUNCH_TIME = 1000;

    scaleFactorX;
    scaleFactorY;

    inputReady
    
    constructor() {
        super("Battle");
    }

    init(battleData) {
        //console.log("INIT BATTLE WITH ENEMY: ", battleData.enemyID);
    }

    preload() {
        //console.log("PRELOAD BATTLE WITH ENEMY");
    }

    create(battleData) {
        //console.log("CREATE BATTLE WITH ENEMY: ", battleData.enemyID);
        this.bg = this.add.image(Main.phaserConfig.width * 0.5, Main.phaserConfig.height * 0.5, 'battleBG_Grass_House_01');
        this.bg.setDisplaySize(Main.phaserConfig.width, Main.phaserConfig.height);
        this.scaleFactorX = this.bg.scaleX;
        this.scaleFactorY = this.bg.scaleY;

        // Build command menu
        this.menuCont = this.add.container(0, 0);

        this.menuBG = this.add.image(0, 0, 'battleMenuBG');
        this.menuBG.setOrigin(0.5);
        this.menuCont.add(this.menuBG);

        // TODO: Make this an image instead of text, or find way to stylize fairly well here.
        var cmd_Fight = this.add.text(0, 0, "FIGHT", Consts.DISP_NAME_STYLE);
        cmd_Fight.setOrigin(0.5);
        this.menuCont.add(cmd_Fight);

        // X is set perfectly, y being just barely off screen
        this.menuCont.setPosition((this.menuBG.width * 0.5) + 10, Main.phaserConfig.height + (this.menuBG.height * 0.5) + 10);

        var self = this;

        Network.CreateResponse("RecPlayerAction", (action) => {
            // TODO: Do everything graphically here. This could be my own actions, or one of the other players
            console.log(`Player ${action.socketID} acted. Enemy HP: ${action.enemyHP}`);
        });

        Network.CreateResponse('RecBattleWon', (data) => {
            self.inputReady = false;

            const propertyConfigX = {
                ease: 'Expo.easeInOut',
                from: self.scaleFactorX,
                start: self.scaleFactorX,
                to: 0,
            };
            const propertyConfigY = {
                ease: 'Expo.easeInOut',
                from: self.scaleFactorY,
                start: self.scaleFactorY,
                to: 0,
            };
    
            self.tweens.add({
                delay: self.LAUNCH_TIME * 0.5,
                duration: self.LAUNCH_TIME,
                scaleX: propertyConfigX,
                scaleY: propertyConfigY,
                targets: self.bg,
                onComplete: () => {
                    Main.player.inBattle = false;
                    Main.player.inBattle = false;
                    console.log("Battle won!");
                    Main.DispMessage("You won!", 2);
                    Main.DispMessage("Got x exp!", 2);
                    self.scene.sleep("Battle");
                }
            });

            const menuPropertyConfig = {
                ease: 'Back',
                from: Main.phaserConfig.height - (self.menuBG.height * 0.5) - 10,
                start: Main.phaserConfig.height - (self.menuBG.height * 0.5) - 10,
                to: Main.phaserConfig.height + (self.menuBG.height * 0.5) + 10,
            };
            self.tweens.add({
                delay: self.LAUNCH_TIME * 0.25,
                duration: self.LAUNCH_TIME * 0.5,
                y: menuPropertyConfig,
                targets: self.menuCont
            });
        });

        // TODO: Implement
        Network.CreateResponse("RecBattleLost", () => {
            
        });

        this.input.keyboard.on('keydown_ENTER', () => {
            if(!self.inputReady)
                return;

            // TODO: Do nothing graphically here, just send input/command
            Network.Emit("BattleAction");
        });

        // The event will be what fires every battle after the first, hence calling this.Start one time below it.
        this.events.on('wake', this.Start);
        this.Start(this.sys, battleData);
    }

    // Will run every time this scene is called.
    // The "sys" is a scene object that references the scene as well.
    // TODO: I could potentitally setup the whole scene quiently in the background, putting it to sleep right away,
    // and only wake it up once the battles happen, including the first battle.
    // We'll see if that becomes necessary.
    Start(sys, battleData) {
        //console.log("WAKE EVENT, BATTLE WITH ENEMY: ", battleData.enemyID)
        var scene = sys.scene;

        const propertyConfigX = {
            ease: 'Back',
            from: 0,
            start: 0,
            to: scene.scaleFactorX,
        };
        const propertyConfigY = {
            ease: 'Back',
            from: 0,
            start: 0,
            to: scene.scaleFactorY,
        };

        scene.tweens.add({
            delay: scene.LAUNCH_TIME * 0.25,
            duration: scene.LAUNCH_TIME,
            scaleX: propertyConfigX,
            scaleY: propertyConfigY,
            targets: scene.bg,
            onComplete: () => {
                scene.inputReady = true;
            }
        });

        const menuPropertyConfig = {
            ease: 'Back',
            from: Main.phaserConfig.height + (scene.menuBG.height * 0.5) + 10,
            start: Main.phaserConfig.height + (scene.menuBG.height * 0.5) + 10,
            to: Main.phaserConfig.height - (scene.menuBG.height * 0.5) - 10,
        };
        scene.tweens.add({
            delay: scene.LAUNCH_TIME,
            duration: scene.LAUNCH_TIME * 0.5,
            y: menuPropertyConfig,
            targets: scene.menuCont
        });
    }
}