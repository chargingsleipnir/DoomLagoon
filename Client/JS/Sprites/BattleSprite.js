class BattleSprite {

    constructor(scene, battlePosIndex, idlePos, offScreenX, assetKey, flipX = false) {

        this.scene = scene;
        this.battlePosIndex = battlePosIndex;
        this.idlePos = idlePos;
        this.offScreenX = offScreenX;
        this.assetKey = assetKey;

        this.assetIndex = -1;
        this.moveKeyIndex = -1;

        this.hpMax = 0;
        this.hpPctTo = 0;
        this.hpDispIncrement = 1;

        this.AnimEndCB = () => {};
        this.actionObj = null;
        
        this.SetAssetIndex();

        this.gameObjCont = scene.add.container(this.offScreenX, this.idlePos.y);
        this.gameObjCont.depth = this.idlePos.y;
        this.sprite = scene.add.sprite(0, 0, Main.spriteData.battle.skinPrefix + assetKey , 0);
        this.sprite.setOrigin(0.5);
        this.sprite.setScale(1.75);
        this.gameObjCont.add(this.sprite);

        this.flipXFactor = 1;
        if(flipX) {
            //this.gameObjCont.setScale(-1, 1);
            this.sprite.flipX = true;
            this.flipXFactor = -1;
        }

        // Add name above of the circle.
        this.nameText = scene.add.text(90 * this.flipXFactor, -30, "", Consts.STYLE_DISP_NAME);
        this.nameText.setOrigin(0.5);

        this.damageText = scene.add.text(-50 * this.flipXFactor, -this.sprite.width - 10, "", Consts.STYLE_DISP_DAMAGE);
        this.damageText.setOrigin(0.5);
        this.damageText.alpha = 0;

        // Action timer and hp indicators.
        var actionArcBG = scene.add.graphics();
        this.actionArc = scene.add.graphics();
        var hpArcBG = scene.add.graphics();
        this.hpArc = scene.add.graphics();

        // Add curr HP in the middle of the circle.
        this.hpCurrText = scene.add.text(90 * this.flipXFactor, 20, "", Consts.STYLE_DISP_NAME);
        this.hpCurrText.setOrigin(0.5);

        // TODO: Add number that pops up each time sprite takes damage or heals.
        this.gameObjCont.add(this.nameText);
        this.gameObjCont.add(this.damageText);
        this.gameObjCont.add(actionArcBG);
        this.gameObjCont.add(this.actionArc);
        this.gameObjCont.add(hpArcBG);
        this.gameObjCont.add(this.hpArc);
        this.gameObjCont.add(this.hpCurrText);

        actionArcBG.fillStyle(0x222222, 1);
        actionArcBG.fillCircle(90 * this.flipXFactor, 20, 25);
        hpArcBG.fillStyle(0x800303, 1);
        hpArcBG.fillCircle(90 * this.flipXFactor, 20, 20);

        this.hpPctFrom = this.hpPctTo = 100;
        this.hpChangeFactor = -1;
        this.DrawHP(this.hpPctTo);

        this.inBattle = false;

        // this.sprite.on('animationstart', (anim, frame) => {
        // }, this.scene);

        // TODO: Fill out anim data json with audio clip frames for all animations
        // TODO: Clean up fighter's second and third attack frame positions
        // TODO: Increase the base volume of the hit sound, make sure all effects have roughly the same base volume (amplitude?)

        let audioClipSetsLength = Main.spriteData.battle["audioClips-by-frames"].length;
        this.sprite.on(`animationupdate`, (anim, frame, gameObj) => {
            // TODO: Put audio clip data in for evryone, and get rid of this check.
            if(this.assetIndex >= audioClipSetsLength)
                return;

            var clipObj = Main.spriteData.battle["audioClips-by-frames"][this.assetIndex][this.moveKeyIndex];
            if(clipObj)
                if(clipObj[frame.index])
                    GameAudio.SFXPlay(clipObj[frame.index]);

        }, this.scene);
        // if(Main.spriteData.battle["audioClips-by-frames"][this.assetIndex]) {
        // }
        // else {
        //     console.warn(`Anim data missing audio clips for ${this.assetKey}`);
        // }

        this.sprite.on('animationcomplete', (anim, frame) => {
            //console.log(anim);
            //console.log(frame);
            // Anything that's not idle, return to idle after
            if(anim.key != `${this.assetKey}_${Main.spriteData.battle.moveKeys[0]}`) {
                this.PlayAnim(0);
                this.AnimEndCB(this.scene, this.battlePosIndex, this.actionObj);
            }
        }, this.scene);
    }

    SetTemplate(name, assetKey, hpMax, hpCurr) {
        this.inBattle = true;

        this.nameText.text = name;
        this.UpdateAsset(assetKey);

        this.hpMax = hpMax;
        this.hpCurrText.text = hpCurr;
        this.UpdateHPByCurrMax(hpCurr, hpMax);
    }

    UpdateAsset(assetKey) {
        this.assetKey = assetKey;
        this.SetAssetIndex();
        this.PlayAnim(0);
    }

    SetAssetIndex() {
        this.assetIndex = Main.spriteData.skins.indexOf(this.assetKey);
    }

    EnterBattle(delay, duration) {
        const battleEnterConfig = { ease: 'Back', from: this.offScreenX, start: this.offScreenX, to: this.idlePos.x };
        this.scene.tweens.add({
            delay: delay,
            duration: duration,
            x: battleEnterConfig,
            targets: this.gameObjCont,
            onComplete: () => {
                // Play idle as you get in.
                this.PlayAnim(0);
            }
        });
    }

    // TODO: Add Position reset animation?
    Act(actionObj, AnimEndCB) {
        this.actionObj = actionObj;
        this.AnimEndCB = AnimEndCB;
        this.PlayAnim(actionObj.ability + Consts.ANIM_ABILITY_DIFF);
    }

    PlayAnim(moveKeyIndex) {
        this.moveKeyIndex = moveKeyIndex;

        //* Change sprite origins to get animations all aligned
        //console.log(`Origin object located at ${this.assetIndex}, ${moveKeyIndex}`)
        var originObj = Main.spriteData.battle["skin-move-origins"][this.assetIndex][moveKeyIndex];
        //console.log(`Origin is ${originObj.x}, ${originObj.y}`);
        
        // TODO: Figure out when enemies animations still aren't lining up correctly.
        //* Enemies were getting the reverse of their x origin during testing because of being flipped on the x-axis during battles.
        var originX = originObj.x;
        if(this.flipXFactor == -1)
            originX = 1 - originObj.x;

        this.sprite.setOrigin(originX, originObj.y);
        this.sprite.anims.play(`${this.assetKey}_${Main.spriteData.battle.moveKeys[moveKeyIndex]}`);
    }

    StopAnim() {
        this.inBattle = false;
        this.sprite.anims.stop();
        this.sprite.setTexture(`${Main.spriteData.battle.skinPrefix}_${Main.spriteData.battle.moveKeys[0]}_${this.assetKey}`, 0);
    }

    ExitBattle(delay, duration) {
        this.StopAnim();

        if(this.gameObjCont.x == this.offScreenX) {
            this.gameObjCont.alpha = 1;
            return;
        }
        
        const battleEnterConfig = { ease: 'Back', from: this.idlePos.x, start: this.idlePos.x, to: this.offScreenX };
        this.scene.tweens.add({
            delay: delay,
            duration: duration,
            x: battleEnterConfig,
            targets: this.gameObjCont,
            onComplete: () => {
                this.gameObjCont.alpha = 1;
            }
        });
    }

    // TODO: Sounds, graphics, sprite jitter and any other effects
    Die(delay, duration, OnCompleteCB) {
        this.StopAnim();

        const spriteDieConfig = { ease: 'Linear', from: 1, start: 1, to: 0 };
        this.scene.tweens.add({
            delay: delay,
            duration: duration,
            alpha: spriteDieConfig,
            targets: this.gameObjCont,
            onComplete: () => {
                // Reset this BattleSprite slot to possibly still be commendeered by someone else.
                this.gameObjCont.x = this.offScreenX;
                this.gameObjCont.alpha = 1;
                OnCompleteCB();
            }
        });
    }

    Update() {
        //console.log(`Hp to: ${this.hpPctTo}, from: ${this.hpPctFrom}`);
        if(this.hpPctTo != this.hpPctFrom) {
            this.hpPctFrom += (this.hpDispIncrement * this.hpChangeFactor);
            // Safety check to ensure a single frame blip doesn't cause the value to go past the first check and increment forever.
            if(this.hpPctTo - (this.hpPctFrom * this.hpChangeFactor) <= this.hpDispIncrement * 2)
                this.hpPctFrom = this.hpPctTo;

            this.DrawHP(this.hpPctFrom);
        }
    }

    UpdateActionTimer(percentage) {
        this.actionArc.clear();
        this.actionArc.fillStyle(0x004cff, 1);
        this.actionArc.moveTo(90 * this.flipXFactor, 20);
        this.actionArc.arc(90 * this.flipXFactor, 20, 25, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(-360 * (percentage * 0.01)), true);
        this.actionArc.closePath();
        this.actionArc.fillPath();
    }

    // Little pop-up number
    ShowDamageTaken(damage) {
        this.damageText.text = damage;

        this.damageText.alpha = 1;
        var startY = this.damageText.y;
        var endY = startY - 20;

        const damageTextDispConfig = { ease: 'Back', from: startY, start: startY, to: endY };
        this.scene.tweens.add({
            delay: 0,
            duration: 500,
            y:damageTextDispConfig,
            targets: this.damageText,
            onComplete: () => {
                this.damageText.alpha = 0;
                this.damageText.y = startY;
            }
        });
    }

    UpdateHPByCurrMax(hpCurr, hpMax) {
        if(!this.inBattle) {
            console.warn("Updating hp when battleSprite this.inBattle: ", this.inBattle);
            //return;
        }

        this.hpCurrText.text = hpCurr;

        this.hpPctFrom = this.hpPctTo;
        this.hpPctTo = Math.floor((hpCurr / hpMax) * 100);

        // Presume to show losing health, but if hp is gained, show increasing health.
        this.hpChangeFactor = -1;
        if(this.hpPctTo > this.hpPctFrom)
            this.hpChangeFactor = 1;
    }

    DrawHP(percentage) {
        this.hpArc.clear();
        this.hpArc.fillStyle(0x058003, 1);
        this.hpArc.moveTo(90 * this.flipXFactor, 20);
        this.hpArc.arc(90 * this.flipXFactor, 20, 20, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(360 * (percentage * 0.01)));
        this.hpArc.closePath();
        this.hpArc.fillPath();
    }
}