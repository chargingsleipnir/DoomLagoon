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
    battleOver;
    
    constructor() {
        super("Battle");
        this.menuOptionIdx = Consts.battleCommands.FIGHT;
        this.playerIdxObj = {
            self: -1,
            others: []
        };
        this.battleOver = false;
    }

    preload() {
        this.load.image('battleBG_Grass_House_01', '../../Assets/BattleBackgrounds/Grass_House_01.png');
        this.load.image('battleMenuBG', '../../Assets/GUI/Menu_450x100.png');
        this.load.image('battleMenuCursor', '../../Assets/GUI/arrowRight_32x32.png');

        //* Being able to loop through this depends on very specific naming conventions using the "skin" and "move" names.
        for(let i = 0; i < Main.animData.skins.length; i++) {
            let skin = Main.animData.skins[i];
            for(let j = 0; j < Main.animData.battle.moveKeys.length; j++) {
                let move = Main.animData.battle.moveKeys[j];
                let frame = Main.animData.battle.frameDetails[i][j];
                this.load.spritesheet(`${Main.animData.battle.skinPrefix}_${move}_${skin}`, `../../Assets/Sprites/${skin}/${move}.png`, { frameWidth: frame.w, frameHeight: frame.h, margin: 0, spacing: 0 });
            }
        }
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
        //* Being able to loop through this depends on very specific naming conventions using the "skin" and "move" names.
        for(let i = 0; i < Main.animData.skins.length; i++) {
            let skin = Main.animData.skins[i];
            for(let j = 0; j < Main.animData.battle.moveKeys.length; j++) {
                let move = Main.animData.battle.moveKeys[j];
                let frame = Main.animData.battle.frameDetails[i][j];
                this.anims.create({ key	: `${skin}_${move}`, frames : this.anims.generateFrameNumbers(`${Main.animData.battle.skinPrefix}_${move}_${skin}`, { start: 0, end: frame.count }), repeat: move == 'IDLE' ? -1 : 0, frameRate: 12 });
            }
        }

        // 4 sprites to hold here permanently, 1 enemy and 3 players to use as needed.
        this.spriteEnemy = new BattleSprite(this, -1, { x: 250, y: 325 }, -100, 'KnightAxeRed', true);
        this.spritePlayers[0] = new BattleSprite(this, 0, { x: 700, y: 350 }, Main.phaserConfig.width + 100, 'FighterAxeBlue');
        this.spritePlayers[1] = new BattleSprite(this, 1, { x: 775, y: 250 }, Main.phaserConfig.width + 100, 'FighterAxeBlue');
        this.spritePlayers[2] = new BattleSprite(this, 2, { x: 800, y: 450 }, Main.phaserConfig.width + 100, 'FighterAxeBlue');

        var self = this;

        Network.CreateResponse('RecAddPlayer', (playerObj) => {
            this.playerIdxObj.others.push(playerObj.battlePosIndex);
            this.spritePlayers[playerObj.battlePosIndex].SetTemplate(playerObj.name, playerObj.hpMax, playerObj.hpCurr);
            this.spritePlayers[playerObj.battlePosIndex].EnterBattle(this.LAUNCH_TIME, this.LAUNCH_TIME * 0.5);
            console.log(`Player ${playerObj.name} added at battle posiiton index ${playerObj.battlePosIndex}. HP: ${playerObj.hpCurr} of ${playerObj.hpMax}`);
            console.log(`playerIdxObj now:`, this.playerIdxObj);
        });

        Network.CreateResponse('RecLosePlayer', (battleIndex) => {
            this.LosePlayer(battleIndex);
        });

        // TODO: It looks like I may be getting closer to blending this function with that of the enemy's attack response
        Network.CreateResponse("RecPlayerAction", (actionObj) => {
            if(this.battleOver)
                return;

            var playerWon = actionObj.targetHPCurr <= 0;
            if(playerWon) {
                this.battleOver = true;
                this.SetActionReady(false);
            }

            if(actionObj.command == Consts.battleCommands.FIGHT) {
                console.log(`Player ${actionObj.actorBattleIdx} (${actionObj.socketID}) fought, doing ${actionObj.damage} damage. Enemy HP: ${actionObj.targetHPCurr} of ${actionObj.targetHPMax}`);
                
                if(this.spritePlayers[actionObj.actorBattleIdx].inBattle) {
                    this.spritePlayers[actionObj.actorBattleIdx].Act(2, actionObj, () => {
                        this.spriteEnemy.ShowDamageTaken(actionObj.damage);
                        this.spriteEnemy.UpdateHPByCurrMax(actionObj.targetHPCurr, actionObj.targetHPMax);
                        // Cannot use "this.battleOver" as this check, as "this.battleOver" is set in mutiple places for multiple reasons, including my own death
                        if(playerWon) {
                            console.log("Battle won!");
                            Main.DispMessage("You won!", 2);
                            Main.DispMessage("Got x exp!", 2);
                
                            this.spriteEnemy.Die(250, 1500, () => {
                                this.EndBattleScene(this, true, null);
                            });            
                        }
                        else {
                            // I was the player who just went - get my next turn ready.
                            if(actionObj.actorBattleIdx == this.playerIdxObj.self) {
                                Network.Emit("ResetActionTimer");
                            }
                        }
                    });
                }
            }
            // RUN, only other option for now.
            else {
                console.log(`Player ${actionObj.socketID} ran.`);
                // I ran, end whole battle
                if(actionObj.socketID == Network.GetSocketID())
                    self.EndBattleScene(self, false, null);
                // Someone else ran, just get rid of them.
                else {
                    self.LosePlayer(actionObj.actorBattleIdx);
                }
            }
        });

        Network.CreateResponse("RecEnemyAction", (actionObj) => {
            if(this.battleOver)
                return;

            // If through some latency or disconnect issue the player is already gone, do nothing.
            if(!this.spritePlayers[actionObj.targetBattleIdx].inBattle)
                return;

            console.log(`Enemy attacked player ${actionObj.targetBattleIdx} (${actionObj.socketID}), doing ${actionObj.damage} damage. Player HP: ${actionObj.targetHPCurr} of ${actionObj.targetHPMax}`);

            var selfKilled = false;
            // Who was attacked, myself or another player.
            if(actionObj.targetBattleIdx == this.playerIdxObj.self) {
                // I've been killed
                selfKilled = actionObj.targetHPCurr <= 0;
                if(selfKilled) {
                    this.battleOver = true;
                    this.SetActionReady(false);
                }
            }

            // Only move for enemies right now.
            if(actionObj.command == Consts.battleCommands.FIGHT) {
                this.spriteEnemy.Act(2, actionObj, () => {
                    this.spritePlayers[actionObj.targetBattleIdx].ShowDamageTaken(actionObj.damage);
                    this.spritePlayers[actionObj.targetBattleIdx].UpdateHPByCurrMax(actionObj.targetHPCurr, actionObj.targetHPMax);
                    if(actionObj.targetHPCurr <= 0) {
                        if(selfKilled) {
                            console.log("YOU WERE KILLED!");
                            Main.DispMessage("Oh no, you died!", 3);
                            this.spritePlayers[actionObj.targetBattleIdx].Die(250, 1500, () => {
                                // Can't do this, or Battle scene controls remain whilst player is already off server.
                                this.scene.pause("Overworld");
                                this.EndBattleScene(this, false, () => {
                                    RestartMenu.Open();
                                });
                            });
                        }
                        else {
                            console.log(`Lost player ${actionObj.targetBattleIdx} (${actionObj.socketID})`);
                            Main.DispMessage("Player died!", 2);
                            this.spritePlayers[actionObj.targetBattleIdx].Die(250, 1500, () => {});            
                        }
                    }
                });
            }
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
                    console.log("Reactivating Battle readiness. (Battle scene is asleep)");
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
        var scene = sys.scene;

        scene.battleOver = false;

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
        scene.spriteEnemy.SetTemplate(battleData.enemyName, battleData.enemyHPMax, battleData.enemyHPCurr);
        scene.spriteEnemy.EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        
        scene.playerIdxObj.self = battleData.playerIdxObj.self;
        scene.playerIdxObj.others = battleData.playerIdxObj.others.slice();

        if(scene.playerIdxObj.self > -1) {
            var selfData = battleData.playerData[scene.playerIdxObj.self];
            scene.spritePlayers[scene.playerIdxObj.self].SetTemplate(selfData.name, selfData.hpMax, selfData.hpCurr);
            scene.spritePlayers[scene.playerIdxObj.self].EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        }
        for(let i = 0; i < scene.playerIdxObj.others.length; i++) {
            var playerData = battleData.playerData[scene.playerIdxObj.others[i]];
            scene.spritePlayers[scene.playerIdxObj.others[i]].SetTemplate(playerData.name, playerData.hpMax, playerData.hpCurr);
            scene.spritePlayers[scene.playerIdxObj.others[i]].EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        }
    }

    LosePlayer(battleIndex) {
        var listIdx = this.playerIdxObj.others.indexOf(battleIndex);
        this.playerIdxObj.others.splice(listIdx, 1);
        this.spritePlayers[battleIndex].ExitBattle(this.LAUNCH_TIME * 0.25, this.LAUNCH_TIME * 0.75);
        console.log(`Player at battle index ${battleIndex} left`);
        console.log(`playerIdxObj remaining:`, this.playerIdxObj);
    }

    SetActionReady(beReady) {
        this.actionReady = beReady;
        this.menuCont.alpha = beReady ? 1 : 0.5;
    }


    // Needs the scene passed into it if it's going to be used as a Network response
    EndBattleScene(scene, battleWon, SceneSleepCB) {
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
                // TODO: These don't seem to be resetting the sprite's HP dial to full, as they should...?
                //scene.spriteEnemy.UpdateHP(100);
                //scene.spriteEnemy.DrawHP(100);
                if(SceneSleepCB)
                    SceneSleepCB();
                else
                    scene.scene.sleep("Battle", { battleWon: battleWon });
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
            scene.spriteEnemy.ExitBattle(scene.LAUNCH_TIME * 0.25, scene.LAUNCH_TIME * 0.75);
            for(let i = 0; i < scene.playerIdxObj.others.length; i++) {
                scene.spritePlayers[scene.playerIdxObj.others[i]].ExitBattle(scene.LAUNCH_TIME * 0.25, scene.LAUNCH_TIME * 0.75);
            }
        //}

        scene.playerIdxObj.self = -1;
        scene.playerIdxObj.others = [];
    }

    ChangeMenuOption() {
        // TODO: Adjust if implementing more than 2 options.
        this.menuOptionIdx = (this.menuOptionIdx == 0) ? 1 : 0;
        this.menuCursor.setY(this.menuOptionTexts[this.menuOptionIdx].y);
    }
}