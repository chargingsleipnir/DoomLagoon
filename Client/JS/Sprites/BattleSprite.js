class BattleSprite {

    scene;

    name;
    sprite;

    battlePosIndex;

    idlePos;
    offScreenX;
    spriteSkinName;

    inBattle;
    gameObjCont;

    actionArc;
    hpArc;

    flipXFactor;

    hpMax;
    hpCurr;
    hpPctFrom;
    hpPctTo;
    hpChangeFactor;
    hpDispIncrement = 1;

    AnimEndCB = () => {};
    actionObj = null;

    // TODO: Bettter tie-in with map sprites
    // TODO: I need to put their names on the battle field!!!

    constructor(scene, battlePosIndex, idlePos, offScreenX, spriteSkinName, flipX = false) {
        this.scene = scene;
        this.battlePosIndex = battlePosIndex;
        this.idlePos = idlePos;
        this.offScreenX = offScreenX;
        this.spriteSkinName = spriteSkinName;

        // TODO: Start off screen
        this.gameObjCont = scene.add.container(this.offScreenX, this.idlePos.y);
        this.sprite = scene.add.sprite(0, 0, Main.animData.battle.skinPrefix + spriteSkinName , 0);
        this.sprite.setScale(1.75);
        this.gameObjCont.add(this.sprite);

        this.flipXFactor = 1;
        if(flipX) {
            //this.gameObjCont.setScale(-1, 1);
            this.sprite.flipX = true;
            this.flipXFactor = -1;
        }

        // Action timer and hp indicators.
        var actionArcBG = scene.add.graphics();
        this.actionArc = scene.add.graphics();
        var hpArcBG = scene.add.graphics();
        this.hpArc = scene.add.graphics();

        // TODO: Add number that pops up each time sprite takes damage or heals.
        // TODO: Add current HP value in centre of dial.
        this.gameObjCont.add(actionArcBG);
        this.gameObjCont.add(this.actionArc);
        this.gameObjCont.add(hpArcBG);
        this.gameObjCont.add(this.hpArc);

        actionArcBG.fillStyle(0x222222, 1);
        actionArcBG.fillCircle(90 * this.flipXFactor, 20, 30);
        hpArcBG.fillStyle(0x800303, 1);
        hpArcBG.fillCircle(90 * this.flipXFactor, 20, 25);

        this.hpPctFrom = this.hpPctTo = 100;
        this.hpChangeFactor = -1;
        this.UpdateHPByPct(this.hpPctTo);
        this.DrawHP(this.hpPctTo);

        this.sprite.anims.play(spriteSkinName + '_Battle_Idle');

        this.inBattle = false;

        var self = this;

        // TODO: Should be able to do this for any animation, to read frames, and launch events specifically on them.
        // this.sprite.on('animationupdate-' + this.spriteSkinName + '_Battle_Swing', (anim, frame, gameObj) => {
        // }, this.scene);

        this.sprite.on('animationcomplete', (anim, frame) => {
            //console.log(anim);
            //console.log(frame);
            // Anything that's not idle, return to idle after
            if(anim.key != self.spriteSkinName + '_Battle_Idle') {
                self.sprite.anims.play(spriteSkinName + '_Battle_Idle');
                this.AnimEndCB(this.scene, this.battlePosIndex, this.actionObj);
            }
        }, this.scene);
    }

    SetTemplate(name, hpMax, hpCurr) {
        this.name = name;
        this.hpMax = hpMax;
        this.hpCurr = hpCurr;

        this.UpdateHPByCurrMax(hpCurr, hpMax);
    }

    EnterBattle(delay, duration) {
        this.inBattle = true;
        const battleEnterConfig = { ease: 'Back', from: this.offScreenX, start: this.offScreenX, to: this.idlePos.x };
        this.scene.tweens.add({
            delay: delay,
            duration: duration,
            x: battleEnterConfig,
            targets: this.gameObjCont
        });
    }

    ExitBattle(delay, duration) {
        this.inBattle = false;
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

    Dodge(actionObj, AnimEndCB) {
        this.actionObj = actionObj;
        this.AnimEndCB = AnimEndCB;
        this.sprite.anims.play(this.spriteSkinName + '_Battle_Dodge');
    }

    Swing(actionObj, AnimEndCB) {
        this.actionObj = actionObj;
        this.AnimEndCB = AnimEndCB;
        this.sprite.anims.play(this.spriteSkinName + '_Battle_Swing');
    }

    Chop(actionObj, AnimEndCB) {
        this.actionObj = actionObj;
        this.AnimEndCB = AnimEndCB;
        this.sprite.anims.play(this.spriteSkinName + '_Battle_Chop');
    }

    // TODO: Sounds, graphics, sprite jitter and any other effects
    Die(delay, duration, OnCompleteCB) {
        this.inBattle = false;
        const spriteDieConfig = { ease: 'Linear', from: 1, start: 1, to: 0 };
        this.scene.tweens.add({
            delay: delay,
            duration: duration,
            alpha: spriteDieConfig,
            targets: this.gameObjCont,
            onComplete: OnCompleteCB
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
        this.actionArc.arc(90 * this.flipXFactor, 20, 30, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(-360 * (percentage * 0.01)), true);
        //this.actionProgressArc.slice(130, 0, 30, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(125));
        this.actionArc.closePath();
        this.actionArc.fillPath();
    }

    // TODO: This is a hard increase/drop. Get step updates or tweening in here.
    UpdateHPByCurrMax(hpCurr, hpMax) {
        this.UpdateHPByPct(Math.floor((hpCurr / hpMax) * 100));
    }
    UpdateHPByPct(percentage) {
        this.hpPctFrom = this.hpPctTo;
        this.hpPctTo = percentage;

        // Presume to show losing health, but if hp is gained, show increasing health.
        this.hpChangeFactor = -1;
        if(this.hpPctTo > this.hpPctFrom)
            this.hpChangeFactor = 1;
    }
    DrawHP(percentage) {
        this.hpArc.clear();
        this.hpArc.fillStyle(0x058003, 1);
        this.hpArc.moveTo(90 * this.flipXFactor, 20);
        this.hpArc.arc(90 * this.flipXFactor, 20, 25, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(360 * (percentage * 0.01)));
        this.hpArc.closePath();
        this.hpArc.fillPath();
    }
}