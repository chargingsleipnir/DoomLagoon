class BattleSprite {

    scene;
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

    hpPctFrom;
    hpPctTo;
    hpChangeFactor;
    hpDispIncrement = 1;

    constructor(scene, battlePosIndex, idlePos, offScreenX, spriteSkinName, AnimEndCB, flipX = false) {
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
        this.UpdateHP(this.hpPctTo);
        this.DrawHP(this.hpPctTo);

        this.sprite.anims.play(spriteSkinName + '_Battle_Idle');

        this.inBattle = false;

        var self = this;
        this.sprite.on('animationcomplete', (anim, frame) => {
            //console.log(anim);
            //console.log(frame);
            // Anything that's not idle, return to idle after
            if(anim.key != self.spriteSkinName + '_Battle_Idle') {
                self.sprite.anims.play(spriteSkinName + '_Battle_Idle');
                AnimEndCB(this.scene, this.battlePosIndex);
            }
        }, this.scene);
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
            targets: this.gameObjCont
        });
    }

    Dodge() {
        this.sprite.anims.play(this.spriteSkinName + '_Battle_Dodge');
    }

    Swing() {
        this.sprite.anims.play(this.spriteSkinName + '_Battle_Swing');
    }

    Chop() {
        this.sprite.anims.play(this.spriteSkinName + '_Battle_Chop');
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
    UpdateHP(percentage) {
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