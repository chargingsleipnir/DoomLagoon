class Battle extends Phaser.Scene {
    
    constructor() {
        super("Battle");

        this.bg = null;

        this.cmdMenuCont = null;
        this.cmdMenuContX = 0;
        this.menuContYOffScreen = 0;
        this.menuContYOnScreen = 0;
    
        // Needs to be seperated for mask to work.
        this.menuAbilityCmdCont = null;
        this.menuAbilityMaskSprite = null;
    
        this.menuCursor = null;
        this.menuCmdIndex = Consts.battleCommands.FIGHT;
        this.menuCmdXPos = {};
    
        this.menuAbilityOpts = [];
        this.menuAbilityOptIndex = 0;
        this.MENU_ABILITY_OPT_SPACE = 35;
    
        this.equipLevel = 0;
        this.powerIndicator = null;
        this.speedIndicator = null;
    
        this.LAUNCH_TIME = 1000;
    
        this.scaleFactorX = 1;
        this.scaleFactorY = 1;
    
        this.actionReady = false;
    
        this.spriteEnemy = null;
        this.spritePlayers = [];

        this.playerIdxObj = {
            self: -1,
            others: []
        };
        this.battleOver = false;
    }

    create() {
        this.bg = this.add.image(Main.phaserConfig.width * 0.5, Main.phaserConfig.height * 0.5, 'battleBG_Field');
        this.bg.setDisplaySize(Main.phaserConfig.width, Main.phaserConfig.height);
        this.scaleFactorX = this.bg.scaleX;
        this.scaleFactorY = this.bg.scaleY;

        // ====================================== BUILDING MENUS

        // ------------------------ Player commands (centre)
        this.cmdMenuCont = this.add.container(0, 0);

        var menuBGCmd = this.add.image(0, 0, 'battleMenuCommandBG');
        menuBGCmd.setOrigin(0.5);
        this.cmdMenuCont.add(menuBGCmd);

        this.cmdMenuContX = Main.phaserConfig.width * 0.5;
        this.menuContYOffScreen = Main.phaserConfig.height + (menuBGCmd.height * 0.5) + 10;
        this.menuContYOnScreen = Main.phaserConfig.height - (menuBGCmd.height * 0.5) - 10;
        
        // X is set perfectly, y being just barely off screen
        this.cmdMenuCont.setPosition(this.cmdMenuContX, this.menuContYOffScreen);
        
        this.menuAbilityCmdCont = this.add.container(this.cmdMenuContX, this.menuContYOffScreen);

        // TODO: Make these menu options images instead of text, or find way to stylize fairly well here.
        // TODO: For so long as there's only 2 menu options, this works well enough for now.
        this.menuAbilityOpts.push(this.add.text(-140, 0, "Attack 0", Consts.STYLE_DISP_NAME));
        this.menuAbilityOpts[0].setOrigin(0, 0.5);
        this.menuAbilityCmdCont.add(this.menuAbilityOpts[0]);

        for(let i = 1; i < Consts.abilityUpgrades.LEVEL2 + 1; i++) {
            this.menuAbilityOpts.push(this.add.text(-140, this.MENU_ABILITY_OPT_SPACE * i, "Attack " + i, Consts.STYLE_DISP_NAME));
            this.menuAbilityOpts[i].setOrigin(0, 0.5);
            this.menuAbilityOpts[i].alpha = 0;
            this.menuAbilityOpts[i].active = false;
            this.menuAbilityCmdCont.add(this.menuAbilityOpts[i]);
        }

        this.menuAbilityMaskSprite = this.make.sprite({ x: this.cmdMenuContX, y: this.menuContYOffScreen, key: "battleMenuCommandMask", add: false });
        var menuBitmapMask = new Phaser.Display.Masks.BitmapMask(this, this.menuAbilityMaskSprite);

        this.menuAbilityCmdCont.mask = menuBitmapMask;

        // Ability level indicators
        this.powerIndicator = new LevelIndicator(this, this.cmdMenuCont, 0, "Power", 0xff7b00, 1);
        this.speedIndicator = new LevelIndicator(this, this.cmdMenuCont, 50, "Speed", 0xfffb00, 3);

        // Run command sits independent of the three attack options
        var runCmd = this.add.text(145, 0, "Run", Consts.STYLE_DISP_NAME);
        runCmd.setOrigin(0, 0.5);
        this.cmdMenuCont.add(runCmd);

        this.menuCursor = this.add.image(0, 0, 'battleMenuCursor');
        this.menuCursor.setOrigin(0.5);
        this.cmdMenuCont.add(this.menuCursor);

        this.menuCmdXPos[Consts.battleCommands.FIGHT] = this.menuAbilityOpts[0].x - this.menuCursor.width * 0.5 - 10;
        this.menuCmdXPos[Consts.battleCommands.RUN] = runCmd.x - this.menuCursor.width * 0.5 - 10;
        this.SetMenuOption(Consts.battleCommands.FIGHT);

        this.SetActionReady(false);

        // ------------------------ Enemy details (Left)
        var menuBGEnemyDets = this.add.image((-menuBGCmd.width * 0.5) - 10, 0, 'battleMenuDetailBG');
        menuBGEnemyDets.setOrigin(1.0, 0.5);
        this.cmdMenuCont.add(menuBGEnemyDets);
        var progressIndEnemy = new ProgIndr(this, this.cmdMenuCont, (-menuBGCmd.width * 0.5) - 10 - menuBGEnemyDets.width + 15, 0, "Enemy");
        
        // ------------------------ Player details (Right)
        var menuBGPlayersDets = this.add.image((menuBGCmd.width * 0.5) + 10, 0, 'battleMenuDetailBG');
        menuBGPlayersDets.setOrigin(0, 0.5);
        this.cmdMenuCont.add(menuBGPlayersDets);
        var progressIndPlayerTop = new ProgIndr(this, this.cmdMenuCont, (menuBGCmd.width * 0.5) + 25, -27, "Player T");
        var progressIndPlayerMiddle = new ProgIndr(this, this.cmdMenuCont, (menuBGCmd.width * 0.5) + 25, 0, "Player M");
        var progressIndPlayerBottom = new ProgIndr(this, this.cmdMenuCont, (menuBGCmd.width * 0.5) + 25, 27, "Player B");

        // ANIMATIONS
        //* Being able to loop through this depends on very specific naming conventions using the "skin" and "move" names.
        for(let i = 0; i < Main.spriteData.skins.length; i++) {
            let skin = Main.spriteData.skins[i];
            for(let j = 0; j < Main.spriteData.battle.moveKeys.length; j++) {
                let move = Main.spriteData.battle.moveKeys[j];
                let frame = Main.spriteData.battle.frameDetails[i][j];
                if(frame != null)
                    this.anims.create({ key	: `${skin}_${move}`, frames : this.anims.generateFrameNumbers(`${Main.spriteData.battle.skinPrefix}_${move}_${skin}`, { start: 0, end: frame.count }), repeat: move == 'IDLE' ? -1 : 0, frameRate: 16 });
            }
        }

        // 4 sprites to hold here permanently, 1 enemy and 3 players to use as needed. Middle player's position if used first, hence they're at index 0.
        this.spriteEnemy = new BattleSprite(this, -1, { x: 250, y: 325 }, -200, 'KnightAxeRed', progressIndEnemy, true);
        this.spritePlayers[0] = new BattleSprite(this, 0, { x: 700, y: 310 }, Main.phaserConfig.width + 200, 'FighterAxeBlue', progressIndPlayerMiddle);
        this.spritePlayers[1] = new BattleSprite(this, 1, { x: 625, y: 270 }, Main.phaserConfig.width + 200, 'FighterAxeBlue', progressIndPlayerTop);
        this.spritePlayers[2] = new BattleSprite(this, 2, { x: 775, y: 350 }, Main.phaserConfig.width + 200, 'FighterAxeBlue', progressIndPlayerBottom);
        this.spritePlayers[1].SetActive(false);
        this.spritePlayers[2].SetActive(false);

        var self = this;

        Network.CreateResponse('RecAddPlayer', (playerObj) => {
            this.playerIdxObj.others.push(playerObj.battlePosIndex);
            this.spritePlayers[playerObj.battlePosIndex].SetTemplate(playerObj.name, playerObj.assetKey, playerObj.hpCurr, playerObj.hpMax);
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
                    this.spritePlayers[actionObj.actorBattleIdx].Act(actionObj, () => {
                        this.spriteEnemy.ShowDamageTaken(actionObj.damage);
                        this.spriteEnemy.UpdateHPByCurrMax(actionObj.targetHPCurr, actionObj.targetHPMax);
                        // Cannot use "this.battleOver" as this check, as "this.battleOver" is set in mutiple places for multiple reasons, including my own death
                        if(playerWon) {
                            console.log("Battle won!");
                            Main.DispMessage("You won!", 2);
                            //Main.DispMessage("Got x exp!", 2);
                
                            this.spriteEnemy.Die(250, 1500, () => {
                                this.EndBattleScene(true, null);
                            });            
                        }
                        else {
                            // I was the player who just went - get my next turn ready.
                            if(actionObj.actorBattleIdx == this.playerIdxObj.self) {
                                console.log("Calling server to reset action timer.");
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
                    this.EndBattleScene(false, null);
                // Someone else ran, just get rid of them.
                else {
                    this.LosePlayer(actionObj.actorBattleIdx);
                }
            }
        });

        Network.CreateResponse("RecEnemyAction", (actionObj) => {
            if(this.battleOver) {
                console.warn(`Received an enemy action from the server even though "this.battleOver" is: ${this.battleOver}`);
                return;
            }

            // If through some latency or disconnect issue the player is already gone, do nothing.
            if(!this.spritePlayers[actionObj.targetBattleIdx].inBattle) {
                console.warn(`Received an enemy action from the server to a player whose "inbattle" prop is: ${this.spritePlayers[actionObj.targetBattleIdx].inBattle}`);
                return;
            }

            console.log(`Enemy attacked player ${actionObj.targetBattleIdx} (${actionObj.socketID}), doing ${actionObj.damage} damage. Player HP: ${actionObj.targetHPCurr} of ${actionObj.targetHPMax}`);

            var selfKilled = false;
            // Who was attacked, myself or another player.
            if(actionObj.targetBattleIdx == this.playerIdxObj.self) {
                // I've been killed, shut off controls immediately
                selfKilled = actionObj.targetHPCurr <= 0;
                if(selfKilled) {
                    this.battleOver = true;
                    this.SetActionReady(false);
                }
            }

            // Only move for enemies right now.
            if(actionObj.command == Consts.battleCommands.FIGHT) {
                this.spriteEnemy.Act(actionObj, () => {
                    this.spritePlayers[actionObj.targetBattleIdx].ShowDamageTaken(actionObj.damage);
                    this.spritePlayers[actionObj.targetBattleIdx].UpdateHPByCurrMax(actionObj.targetHPCurr, actionObj.targetHPMax);
                    if(actionObj.targetHPCurr <= 0) {
                        if(selfKilled) {
                            console.log("YOU WERE KILLED!");
                            Main.DispMessage("Oh no, you died!", 3);
                            this.spritePlayers[actionObj.targetBattleIdx].Die(250, 1500, () => {
                                // Can't do this, or Battle scene controls remain whilst player is already off server.
                                this.scene.pause("Overworld");
                                this.EndBattleScene(false, () => {
                                    RestartMenu.Open();
                                });
                            });
                        }
                        else {
                            // BOOKMARK
                            console.log(`Lost player ${actionObj.targetBattleIdx} (${actionObj.socketID})`);
                            Main.DispMessage("Player died!", 2);
                            var listIdx = this.playerIdxObj.others.indexOf(actionObj.targetBattleIdx);
                            this.playerIdxObj.others.splice(listIdx, 1);
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
            if(!this.actionReady)
                return;

            this.ChangeAbilityOption(-1);
        });
        this.input.keyboard.on('keydown_S', () => {
            if(!this.actionReady)
                return;

            this.ChangeAbilityOption(1);
        });
        this.input.keyboard.on('keydown_A', () => {
            if(!this.actionReady)
                return;

            this.ToggleCommandOption();
        });
        this.input.keyboard.on('keydown_D', () => {
            if(!this.actionReady)
                return;

            this.ToggleCommandOption();
        });
        this.input.keyboard.on('keydown_ENTER', () => {
            if(!this.actionReady)
                return;

            this.SetActionReady(false);
            Network.Emit("BattleAction", {
                command: this.menuCmdIndex,
                ability: this.menuAbilityOptIndex,
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

        GameAudio.SetMusicClip("battle", true, true, 0);
        GameAudio.FadeIn(1); 

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

        scene.SetMenuOption(Consts.battleCommands.FIGHT);

        // Make available all commands consistent with ability level
        this.menuAbilityOptIndex = Consts.abilityUpgrades.INIT;
        for(let i = 0; i < battleData.abilityLevel + 1; i++) {
            scene.menuAbilityOpts[i].active = true;
            scene.menuAbilityOpts[i].alpha = 1;
            scene.menuAbilityOpts[i].text = Main.spriteData.battle["skin-move-actionNames"][battleData.equipLevel][i];
        }
        scene.equipLevel = battleData.equipLevel;

        // Not incorporating ability as the default ability entering battle is the first.
        scene.powerIndicator.FillFromBaseline(scene.equipLevel);
        scene.speedIndicator.FillFromBaseline(scene.equipLevel);

        console.log(`Menu options avaiable: `, scene.menuAbilityOpts);

        // Slide in menu
        const menuPropertyConfig = {
            ease: 'Back',
            from: scene.menuContYOffScreen,
            start: scene.menuContYOffScreen,
            to: scene.menuContYOnScreen 
        };
        scene.tweens.add({
            delay: scene.LAUNCH_TIME,
            duration: scene.LAUNCH_TIME * 0.5,
            y: menuPropertyConfig,
            targets: [scene.cmdMenuCont, scene.menuAbilityCmdCont, scene.menuAbilityMaskSprite]
        });

        // Change the background based on the enemy being fought.
        scene.SetBGAsset(battleData.enemyAssetKey);

        // Slide in characters
        scene.spriteEnemy.SetTemplate(battleData.enemyName, battleData.enemyAssetKey, battleData.enemyHPCurr, battleData.enemyHPMax);
        scene.spriteEnemy.EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        
        scene.playerIdxObj.self = battleData.playerIdxObj.self;
        scene.playerIdxObj.others = battleData.playerIdxObj.others.slice();

        if(scene.playerIdxObj.self > -1) {
            var selfData = battleData.playerData[scene.playerIdxObj.self];
            scene.spritePlayers[scene.playerIdxObj.self].SetTemplate(selfData.name, selfData.assetKey, selfData.hpCurr, selfData.hpMax);
            scene.spritePlayers[scene.playerIdxObj.self].EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        }
        for(let i = 0; i < scene.playerIdxObj.others.length; i++) {
            var playerData = battleData.playerData[scene.playerIdxObj.others[i]];
            scene.spritePlayers[scene.playerIdxObj.others[i]].SetTemplate(playerData.name, playerData.assetKey, playerData.hpCurr, playerData.hpMax);
            scene.spritePlayers[scene.playerIdxObj.others[i]].EnterBattle(scene.LAUNCH_TIME, scene.LAUNCH_TIME * 0.5);
        }
    }

    // BOOKMARK
    LosePlayer(battleIndex) {
        var listIdx = this.playerIdxObj.others.indexOf(battleIndex);
        this.playerIdxObj.others.splice(listIdx, 1);
        this.spritePlayers[battleIndex].ExitBattle(this.LAUNCH_TIME * 0.25, this.LAUNCH_TIME * 0.75);
        console.log(`Player at battle index ${battleIndex} left`);
        console.log(`playerIdxObj remaining:`, this.playerIdxObj);
    }

    SetActionReady(beReady) {
        this.actionReady = beReady;
        //this.cmdMenuCont.alpha = beReady ? 1 : 0.5;
        this.menuAbilityCmdCont.alpha = beReady ? 1 : 0.5;
    }


    EndBattleScene(battleWon, SceneSleepCB) {

        GameAudio.FadeOut(1);

        // Shrink bg back down
        const propertyConfigX = { ease: 'Expo.easeInOut', from: this.scaleFactorX, start: this.scaleFactorX, to: 0 };
        const propertyConfigY = { ease: 'Expo.easeInOut', from: this.scaleFactorY, start: this.scaleFactorY, to: 0 };
        this.tweens.add({
            delay: this.LAUNCH_TIME * 0.5,
            duration: this.LAUNCH_TIME,
            scaleX: propertyConfigX,
            scaleY: propertyConfigY,
            targets: this.bg,
            onComplete: () => {
                Main.player.inBattle = false;

                for(let i = 1; i < this.menuAbilityOpts.length; i++) {
                    this.menuAbilityOpts[i].active = false;
                    this.menuAbilityOpts[i].alpha = 0;
                    this.menuAbilityOpts[i].text = "";
                }
                // Set menu ability container back into (offscreen) position;
                this.menuAbilityCmdCont.y = this.menuContYOffScreen;
                this.menuAbilityOptIndex = Consts.abilityUpgrades.INIT;

                // TODO: These don't seem to be resetting the sprite's HP dial to full, as they should...?
                //this.spriteEnemy.UpdateHP(100);
                //this.spriteEnemy.DrawHP(100);
                if(SceneSleepCB)
                    SceneSleepCB();
                else {
                    GameAudio.SetMusicClip("titleAndOverworld", true, false, 0);
                    GameAudio.FadeIn(0.5, () => {
                        this.scene.sleep("Battle", { battleWon: battleWon });
                    });
                }
            }
        });

        // Slide menu away
        const menuPropertyConfig = {
            ease: 'Back',
            from: this.menuContYOnScreen,
            start: this.menuContYOnScreen,
            to: this.menuContYOffScreen,
        };
        this.tweens.add({
            delay: this.LAUNCH_TIME * 0.25,
            duration: this.LAUNCH_TIME * 0.5,
            y: menuPropertyConfig,
            targets: [this.cmdMenuCont, this.menuAbilityCmdCont, this.menuAbilityMaskSprite]
        });

        this.spritePlayers[this.playerIdxObj.self].ExitBattle(this.LAUNCH_TIME * 0.25, this.LAUNCH_TIME * 0.75);
        
        // TODO: A different closing animation for if "battleWon", one in which the enemy and other player do not actually leave, as they are of course still be in battle.
        // Perhaps just the player runs and the whole scene fades/drops away...?
        //if(battleWon) {
            this.spriteEnemy.ExitBattle(this.LAUNCH_TIME * 0.25, this.LAUNCH_TIME * 0.75);
            for(let i = 0; i < this.playerIdxObj.others.length; i++) {
                this.spritePlayers[this.playerIdxObj.others[i]].ExitBattle(this.LAUNCH_TIME * 0.25, this.LAUNCH_TIME * 0.75);
            }
        //}

        this.playerIdxObj.self = -1;
        this.playerIdxObj.others = [];
    }

    SetBGAsset(asset) {
        var skinIdx = Main.spriteData.skins.indexOf(asset);
        var region = Main.spriteData.region[skinIdx];
        var texture = "battleBG_Field";
        if(region == Consts.regions.SAND)
            texture = "battleBG_Sand";
        else if(region == Consts.regions.IRON)
            texture = "battleBG_Iron";
        else if(region == Consts.regions.VOLCANO)
            texture = "battleBG_Volcano";
        else if(region == Consts.regions.RUIN)
            texture = "battleBG_Ruin";


        this.bg.setTexture(texture, 0);
    }

    ChangeAbilityOption(indexChange) {
        if(this.menuCmdIndex != Consts.battleCommands.FIGHT)
            return;

        var tempIndex = this.menuAbilityOptIndex;
        tempIndex += indexChange;

        // Attempted to select ability option outside bounds given in Consts.js
        if(tempIndex < Consts.abilityUpgrades.INIT || tempIndex > Consts.abilityUpgrades.LEVEL2)
            return;

        // Option is inactive if the player doesn't have the given ability available.
        if(!this.menuAbilityOpts[tempIndex].active)
            return;

        this.powerIndicator.FillFromBaseline(this.equipLevel + tempIndex);
        this.speedIndicator.FillFromBaseline(this.equipLevel - tempIndex);

        this.menuAbilityOptIndex = tempIndex;
        this.SwitchMenuAbility();
    }
    ToggleCommandOption() {
        if(this.menuCmdIndex == Consts.battleCommands.RUN) {
            this.menuCmdIndex = Consts.battleCommands.FIGHT;
            this.menuCursor.setX(this.menuCmdXPos[Consts.battleCommands.FIGHT]);
        }
        else {
            this.menuCmdIndex = Consts.battleCommands.RUN;
            this.menuCursor.setX(this.menuCmdXPos[Consts.battleCommands.RUN]);
        }
    }
    SetMenuOption(cmdIndex) {
        this.menuCmdIndex = cmdIndex;
        this.menuCursor.setX(this.menuCmdXPos[cmdIndex]);
    }

    SwitchMenuAbility() {
        const menuAbilityConfig = {
            ease: 'Back',
            from: this.menuAbilityCmdCont.y,
            start: this.menuAbilityCmdCont.y,
            to: this.menuContYOnScreen - this.menuAbilityOptIndex * this.MENU_ABILITY_OPT_SPACE 
        };
        this.tweens.add({
            duration: 250,
            y: menuAbilityConfig,
            targets: this.menuAbilityCmdCont
        });
    }
}