class Battle extends SceneTransition {

    bg;

    menuCont;
    menuBG;
    menuCursor;

    menuOptionTexts = [];
    menuOptionIdx;

    LAUNCH_TIME = 1000;

    scaleFactorX;
    scaleFactorY;

    inputReady
    
    constructor() {
        super("Battle");

        this.menuOptionIdx = Consts.battleCommands.FIGHT;
    }

    // init() {
    //     console.log("INIT BATTLE");
    // }

    // preload() {
    //     console.log("PRELOAD BATTLE");
    // }

    create() {
        //console.log("CREATE BATTLE");
        
        this.bg = this.add.image(Main.phaserConfig.width * 0.5, Main.phaserConfig.height * 0.5, 'battleBG_Grass_House_01');
        this.bg.setDisplaySize(Main.phaserConfig.width, Main.phaserConfig.height);
        this.scaleFactorX = this.bg.scaleX;
        this.scaleFactorY = this.bg.scaleY;

        // Build command menu
        this.menuCont = this.add.container(0, 0);

        this.menuBG = this.add.image(0, 0, 'battleMenuBG');
        this.menuBG.setOrigin(0.5);
        this.menuCont.add(this.menuBG);

        // TODO: Make these menu options images instead of text, or find way to stylize fairly well here.
        // TODO: For so long as there's only 2 menu options, this works well enough for now.
        this.menuOptionTexts.push(this.add.text(0, -15, "FIGHT", Consts.DISP_NAME_STYLE));
        this.menuOptionTexts[Consts.battleCommands.FIGHT].setOrigin(0.5);
        this.menuCont.add(this.menuOptionTexts[Consts.battleCommands.FIGHT]);

        this.menuOptionTexts.push(this.add.text(0, 15, "RUN", Consts.DISP_NAME_STYLE));
        this.menuOptionTexts[Consts.battleCommands.RUN].setOrigin(0.5);
        this.menuCont.add(this.menuOptionTexts[Consts.battleCommands.RUN]);

        this.menuCursor = this.add.image(-50, -15, 'battleMenuCursor');
        this.menuCursor.setOrigin(0.5);
        this.menuCont.add(this.menuCursor);

        // X is set perfectly, y being just barely off screen
        this.menuCont.setPosition((this.menuBG.width * 0.5) + 10, Main.phaserConfig.height + (this.menuBG.height * 0.5) + 10);

        var self = this;

        Network.CreateResponse("RecPlayerAction", (actionObj) => {
            // TODO: Do everything graphically here. This could be my own actions, or one of the other players
            console.log(`Player ${actionObj.socketID} acted, doing ${actionObj.damage} damage. Enemy HP: ${actionObj.enemyHP}`);

            if(actionObj.command == Consts.battleCommands.FIGHT) {
                // TODO: Match sprite with socketID and have that sprite run it's fight animation
            }
            // RUN, only other option for now.
            else {
                //* I COULD just do this when selecting to run
                if(actionObj.socketID == Network.GetSocketID()) {
                    // I fled, so end battle scene.
                    self.EndBattleScene(self);
                }
                else {
                    // TODO: Someone else fled, animated their sprite, leaving the battle scene
                }
            }
        });

        // TODO: Get win data
        Network.CreateResponse('RecBattleWon', () => {
            this.EndBattleScene(self, true);
        });

        // TODO: Implement
        Network.CreateResponse("RecBattleLost", () => {
            
        });

        // BATTLE INPUT
        this.input.keyboard.on('keydown_W', () => {
            if(!self.inputReady)
                return;

            self.ChangeMenuOption();
        });
        this.input.keyboard.on('keydown_S', () => {
            if(!self.inputReady)
                return;

            self.ChangeMenuOption();
        });
        this.input.keyboard.on('keydown_ENTER', () => {
            if(!self.inputReady)
                return;

            // TODO: Do nothing graphically here, just send input/command
            Network.Emit("BattleAction", {
                command: this.menuOptionIdx
            });
        });

        //* The event will be what fires every battle after the first, hence calling this.Start one time below it.
        this.events.on('wake', this.Awaken);

        //* On sleep event will allow me to ensure the battle scene is truly asleep before re-engaging in a battle.
        function SetBattleReady(sys, data) {
            if(sys.scene.scene.isSleeping("Battle")) {
                // Allow a few seconds to move freely without getting into another battle, more time if having run away
                if(!data) { // Should be first time only
                    Network.Emit("NextBattleReady");
                    return;
                }

                var time = data.battleWon ? Consts.BATTLE_WON_NEXT_COOLDOWN : Consts.BATTLE_RAN_NEXT_COOLDOWN;
                setTimeout(() => {
                    console.log("Reactivating Battle readiness.");
                    Network.Emit("NextBattleReady");
                }, time * 1000);
            }
            else {
                // Getting sys.scene.scene.isSleeping("Battle") to be true here seems to be unreliable, so check in continuously to ensure that the battle scene is truly good to go.
                setTimeout(function () {
                    SetBattleReady(sys, data);
                }, 500);
            }
        }
        this.scene.get("Battle").events.on('sleep', SetBattleReady);

        //* First time putting it to sleep, no data to pass, just getting ready for the rest of the game.
        this.scene.sleep("Battle");
    }

    Awaken(sys, battleData) {
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

    // Needs the scene passed into it if it's going to be used as a Network response
    EndBattleScene(scene, battleWon = false) {
        scene.inputReady = false;

        const propertyConfigX = {
            ease: 'Expo.easeInOut',
            from: scene.scaleFactorX,
            start: scene.scaleFactorX,
            to: 0,
        };
        const propertyConfigY = {
            ease: 'Expo.easeInOut',
            from: scene.scaleFactorY,
            start: scene.scaleFactorY,
            to: 0,
        };

        scene.tweens.add({
            delay: scene.LAUNCH_TIME * 0.5,
            duration: scene.LAUNCH_TIME,
            scaleX: propertyConfigX,
            scaleY: propertyConfigY,
            targets: scene.bg,
            onComplete: () => {
                Main.player.inBattle = false;

                if(battleWon) {
                    console.log("Battle won!");
                    Main.DispMessage("You won!", 2);
                    Main.DispMessage("Got x exp!", 2);
                }

                scene.scene.sleep("Battle", { battleWon: battleWon });
                console.log("Battle scene sleep called");
            }
        });

        const menuPropertyConfig = {
            ease: 'Back',
            from: Main.phaserConfig.height - (scene.menuBG.height * 0.5) - 10,
            start: Main.phaserConfig.height - (scene.menuBG.height * 0.5) - 10,
            to: Main.phaserConfig.height + (scene.menuBG.height * 0.5) + 10,
        };
        scene.tweens.add({
            delay: scene.LAUNCH_TIME * 0.25,
            duration: scene.LAUNCH_TIME * 0.5,
            y: menuPropertyConfig,
            targets: scene.menuCont
        });
    }

    EndGame() {

    }

    ChangeMenuOption() {
        // TODO: Adjust if implementing more than 2 options.
        this.menuOptionIdx = (this.menuOptionIdx == 0) ? 1 : 0;
        this.menuCursor.setY(this.menuOptionTexts[this.menuOptionIdx].y);
    }
}