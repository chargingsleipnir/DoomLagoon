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

    actionReady;

    spriteEnemy;
    spritePlayers = [];

    playerIdxObj;

    actionDataQueue;
    battleOver;
    
    constructor() {
        super("Battle");

        this.menuOptionIdx = Consts.battleCommands.FIGHT;
        this.playerIdxObj = {
            self: -1,
            others: []
        };
        this.actionDataQueue = [];
        this.battleOver = false;
    }

    preload() {
        this.load.image('battleBG_Grass_House_01', '../../Assets/BattleBackgrounds/Grass_House_01.png');
        this.load.image('battleMenuBG', '../../Assets/GUI/Menu_450x100.png');
        this.load.image('battleMenuCursor', '../../Assets/GUI/arrowRight_32x32.png');

        // Fighter
        this.load.spritesheet('ssBattleIdle_FighterAxeBlue', '../../Assets/Sprites/Fighter/Idle_72x80_23frames.png', { frameWidth: 72, frameHeight: 80, margin: 0, spacing: 0 });
        this.load.spritesheet('ssBattleDodge_FighterAxeBlue', '../../Assets/Sprites/Fighter/Dodge_72x80_13frames.png', { frameWidth: 72, frameHeight: 80, margin: 0, spacing: 0 });
        this.load.spritesheet('ssBattleSwing_FighterAxeBlue', '../../Assets/Sprites/Fighter/Swing_96x80_25frames.png', { frameWidth: 96, frameHeight: 80, margin: 0, spacing: 0 });
        this.load.spritesheet('ssBattleChop_FighterAxeBlue', '../../Assets/Sprites/Fighter/Chop_96x88_30frames.png', { frameWidth: 96, frameHeight: 88, margin: 0, spacing: 0 });

        // Warrior
        this.load.spritesheet('ssBattleIdle_KnightAxeRed', '../../Assets/Sprites/KnightAxeRed/Idle_64x72_23frames.png', { frameWidth: 64, frameHeight: 72, margin: 0, spacing: 0 });
        this.load.spritesheet('ssBattleDodge_KnightAxeRed', '../../Assets/Sprites/KnightAxeRed/Dodge_72x72_13frames.png', { frameWidth: 72, frameHeight: 72, margin: 0, spacing: 0 });
        this.load.spritesheet('ssBattleSwing_KnightAxeRed', '../../Assets/Sprites/KnightAxeRed/Swing_104x112_20frames.png', { frameWidth: 104, frameHeight: 112, margin: 0, spacing: 0 });
        this.load.spritesheet('ssBattleChop_KnightAxeRed', '../../Assets/Sprites/KnightAxeRed/Chop_120x152_24frames.png', { frameWidth: 120, frameHeight: 152, margin: 0, spacing: 0 });
    }

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

        this.SetActionReady(false);

        // ANIMATIONS
        this.anims.create({ key	: 'FighterAxeBlue_Battle_Idle', frames : this.anims.generateFrameNumbers('ssBattleIdle_FighterAxeBlue', { start: 0, end: 23 }), repeat : -1, frameRate : 12 });
        this.anims.create({ key	: 'FighterAxeBlue_Battle_Dodge', frames : this.anims.generateFrameNumbers('ssBattleDodge_FighterAxeBlue', { start: 0, end: 13 }), repeat : 0, frameRate : 20 });
        this.anims.create({ key	: 'FighterAxeBlue_Battle_Swing', frames : this.anims.generateFrameNumbers('ssBattleSwing_FighterAxeBlue', { start: 0, end: 25 }), repeat : 0, frameRate : 20 });
        this.anims.create({ key	: 'FighterAxeBlue_Battle_Chop', frames : this.anims.generateFrameNumbers('ssBattleChop_FighterAxeBlue', { start: 0, end: 30 }), repeat : 0, frameRate : 20 });
        
        this.anims.create({ key	: 'KnightAxeRed_Battle_Idle', frames : this.anims.generateFrameNumbers('ssBattleIdle_KnightAxeRed', { start: 0, end: 23 }), repeat : -1, frameRate : 12 });
        this.anims.create({ key	: 'KnightAxeRed_Battle_Dodge', frames : this.anims.generateFrameNumbers('ssBattleDodge_KnightAxeRed', { start: 0, end: 13 }), repeat : 0, frameRate : 20 });
        this.anims.create({ key	: 'KnightAxeRed_Battle_Swing', frames : this.anims.generateFrameNumbers('ssBattleSwing_KnightAxeRed', { start: 0, end: 20 }), repeat : 0, frameRate : 20 });
        this.anims.create({ key	: 'KnightAxeRed_Battle_Chop', frames : this.anims.generateFrameNumbers('ssBattleChop_KnightAxeRed', { start: 0, end: 24 }), repeat : 0, frameRate : 20 });

        // 4 sprites to hold here permanently, 1 enemy and 3 players to use as needed.
        this.spriteEnemy = new BattleSprite(this, -1, { x: 250, y: 325 }, -100, 'KnightAxeRed', this.PlayerAnimationEndCallback, true);
        this.spritePlayers[0] = new BattleSprite(this, 0, { x: 700, y: 350 }, Main.phaserConfig.width + 100, 'FighterAxeBlue', this.PlayerAnimationEndCallback);
        this.spritePlayers[1] = new BattleSprite(this, 1, { x: 775, y: 275 }, Main.phaserConfig.width + 100, 'FighterAxeBlue', this.PlayerAnimationEndCallback);
        this.spritePlayers[2] = new BattleSprite(this, 2, { x: 800, y: 425 }, Main.phaserConfig.width + 100, 'FighterAxeBlue', this.PlayerAnimationEndCallback);

        var self = this;

        Network.CreateResponse('RecAddPlayer', (battleIndex) => {
            this.playerIdxObj.others.push(battleIndex);
            this.spritePlayers[battleIndex].EnterBattle(this.LAUNCH_TIME, this.LAUNCH_TIME * 0.5);
            console.log(`Player at battle index ${battleIndex} added`);
            console.log(`playerIdxObj now:`, this.playerIdxObj);
        });

        Network.CreateResponse('RecLosePlayer', (battleIndex) => {
            var listIdx = this.playerIdxObj.others.indexOf(battleIndex);
            this.playerIdxObj.others.splice(listIdx, 1);
            this.spritePlayers[battleIndex].ExitBattle(this.LAUNCH_TIME * 0.25, this.LAUNCH_TIME * 0.75);
            console.log(`Player at battle index ${battleIndex} left`);
            console.log(`playerIdxObj remaining:`, this.playerIdxObj);
        });

        Network.CreateResponse("RecPlayerAction", (actionObj) => {
            // Don't take on any more actions past the one that kills the enemy.
            if(this.battleOver)
                return;

            if(actionObj.enemyHPPct == 0)
                this.battleOver = true;

            

            if(actionObj.command == Consts.battleCommands.FIGHT) {
                console.log(`Player ${actionObj.playerBattleIdx} (${actionObj.socketID}) fought, doing ${actionObj.damage} damage. Enemy HP pct: ${actionObj.enemyHPPct}`);
                
                if(this.spritePlayers[actionObj.playerBattleIdx].inBattle) {

                    // TODO: Only add this here because it's running an animation and will thus "shift()" later?? This still needs much refining.
                    this.actionDataQueue.push(actionObj);
                    this.spritePlayers[actionObj.playerBattleIdx].Swing();
                }
            }
            else { // RUN, only other option for now.
                console.log(`Player ${actionObj.socketID} ran.`);

                if(actionObj.socketID == Network.GetSocketID()) {
                    // I fled, so end battle scene.
                    self.EndBattleScene(self);
                }
                else {
                    // TODO: Someone else fled, animate their sprite leaving the battle scene
                }
            }
        });

        // TODO: Implement
        Network.CreateResponse("RecBattleLost", () => {
            
        });

        Network.CreateResponse("RecActionReadyingTick", (tickPctObj) => {
            this.spriteEnemy.UpdateActionTimer(tickPctObj["-1"]);
            delete tickPctObj["-1"]; // So only players remain

            for(let battleIdx in tickPctObj) {
                battleIdx = parseInt(battleIdx);
                this.spritePlayers[battleIdx].UpdateActionTimer(tickPctObj[battleIdx]);
            }
        });

        Network.CreateResponse("RecActionReady", () => {
            self.SetActionReady(true);
        });

        // BATTLE INPUT
        this.input.keyboard.on('keydown_W', () => {
            if(!self.actionReady)
                return;

            self.ChangeMenuOption();
        });
        this.input.keyboard.on('keydown_S', () => {
            if(!self.actionReady)
                return;

            self.ChangeMenuOption();
        });
        this.input.keyboard.on('keydown_ENTER', () => {
            if(!self.actionReady)
                return;

            self.SetActionReady(false);
            Network.Emit("BattleAction", {
                command: this.menuOptionIdx,
                playerBattleIdx: this.playerIdxObj.self
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

    update() {
        this.spriteEnemy.Update();
        this.spritePlayers[0].Update();
        this.spritePlayers[1].Update();
        this.spritePlayers[2].Update();
    }

    Awaken(sys, battleData) {
        //console.log("WAKE EVENT, BATTLE WITH ENEMY: ", battleData.enemyID)
        var scene = sys.scene;

        // Blow up background
        const propertyConfigX = { ease: 'Back', from: 0, start: 0, to: scene.scaleFactorX };
        const propertyConfigY = { ease: 'Back', from: 0, start: 0, to: scene.scaleFactorY };
        scene.tweens.add({
            delay: scene.LAUNCH_TIME * 0.25,
            duration: scene.LAUNCH_TIME,
            scaleX: propertyConfigX,
            scaleY: propertyConfigY,
            targets: scene.bg,
            onComplete: () => {
                // Had "actionReady", but now that just waits for the ATB to fill
            }
        });

        // Slide in menu
        const menuPropertyConfig = {
            ease: 'Back',
            from: Main.phaserConfig.height + (scene.menuBG.height * 0.5) + 10,
            start: Main.phaserConfig.height + (scene.menuBG.height * 0.5) + 10,
            to: Main.phaserConfig.height - (scene.menuBG.height * 0.5) - 10 
        };
        scene.tweens.add({
            delay: scene.LAUNCH_TIME,
            duration: scene.LAUNCH_TIME * 0.5,
            y: menuPropertyConfig,
            targets: scene.menuCont
        });

        // Slide in characters
        scene.spriteEnemy.UpdateHP(battleData.enemyHPPct);
        scene.spriteEnemy.EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        
        scene.playerIdxObj.self = battleData.playerIdxObj.self;
        scene.playerIdxObj.others = battleData.playerIdxObj.others.slice();

        if(scene.playerIdxObj.self > -1) {
            scene.spritePlayers[scene.playerIdxObj.self].EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        }
        for(let i = 0; i < scene.playerIdxObj.others.length; i++) {
            scene.spritePlayers[scene.playerIdxObj.others[i]].EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        }
    }

    SetActionReady(beReady) {
        this.actionReady = beReady;
        this.menuCont.alpha = beReady ? 1 : 0.5;
    }

    PlayerAnimationEndCallback(scene, battlePosIndex) {
        var action = scene.actionDataQueue.shift();

        scene.spriteEnemy.UpdateHP(action.enemyHPPct);

        if(action.enemyHPPct == 0) {
            scene.EndBattleScene(scene, true);
        }
        else {
            if(battlePosIndex == scene.playerIdxObj.self) {
                Network.Emit("ResetActionTimer");
            }
        }
    }

    // Needs the scene passed into it if it's going to be used as a Network response
    EndBattleScene(scene, battleWon = false) {
        scene.SetActionReady(false);

        // Shrink bg back down
        const propertyConfigX = { ease: 'Expo.easeInOut', from: scene.scaleFactorX, start: scene.scaleFactorX, to: 0 };
        const propertyConfigY = { ease: 'Expo.easeInOut', from: scene.scaleFactorY, start: scene.scaleFactorY, to: 0 };
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

        // Slide menu away
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

        scene.spritePlayers[scene.playerIdxObj.self].ExitBattle(scene.LAUNCH_TIME * 0.25, scene.LAUNCH_TIME * 0.75);
        
        // TODO: A different closing animation for if "battleWon", one in which the enemy and other player do not actually leave, as they are of course still be in battle.
        // Perhaps just the player runs and the whole scene fades/drops away...?
        //if(battleWon) {
            console.log(scene.playerIdxObj);

            scene.spriteEnemy.ExitBattle(scene.LAUNCH_TIME * 0.25, scene.LAUNCH_TIME * 0.75);
            for(let i = 0; i < scene.playerIdxObj.others.length; i++) {
                scene.spritePlayers[scene.playerIdxObj.others[i]].ExitBattle(scene.LAUNCH_TIME * 0.25, scene.LAUNCH_TIME * 0.75);
            }
        //}

        scene.playerIdxObj.self = -1;
        scene.playerIdxObj.others = [];
        scene.actionDataQueue = [];
    }

    EndGame() {

    }

    ChangeMenuOption() {
        // TODO: Adjust if implementing more than 2 options.
        this.menuOptionIdx = (this.menuOptionIdx == 0) ? 1 : 0;
        this.menuCursor.setY(this.menuOptionTexts[this.menuOptionIdx].y);
    }
}