class BattleSprite {

    scene;
    sprite;

    idlePos;
    offScreenX;
    spriteSkinName;

    inBattle;
    gameObjCont;

    actionArc;
    hpArc;

    constructor(scene, idlePos, offScreenX, spriteSkinName, flipX = false) {
        this.scene = scene;
        this.idlePos = idlePos;
        this.offScreenX = offScreenX;
        this.spriteSkinName = spriteSkinName;

        // TODO: Start off screen
        this.gameObjCont = scene.add.container(this.offScreenX, this.idlePos.y);
        this.sprite = scene.add.sprite(0, 0, Main.animData.battle.skinPrefix + spriteSkinName , 0);
        this.sprite.setScale(1.75);
        this.gameObjCont.add(this.sprite);

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
        actionArcBG.fillCircle(90, 20, 30);
        hpArcBG.fillStyle(0xd10209, 1);
        hpArcBG.fillCircle(90, 20, 25);

        // TODO: Not sure if I should keep this, just showing a presumed full HP off the start.
        this.UpdateHP(1);

        this.sprite.anims.play(spriteSkinName + '_Battle_Idle');

        if(flipX)
            this.gameObjCont.setScale(-1, 1);

        this.inBattle = false;

        var self = this;
        this.sprite.on('animationcomplete', (anim, frame) => {
            //console.log(anim);
            //console.log(frame);
            // Anything that's not idle, return to idle after
            if(anim.key != self.spriteSkinName + '_Battle_Idle') {
                self.sprite.anims.play(spriteSkinName + '_Battle_Idle');
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

    UpdateActionTimer(percentage) {
        this.actionArc.clear();
        this.actionArc.fillStyle(0x004cff, 1);
        this.actionArc.moveTo(90, 20);
        this.actionArc.arc(90, 20, 30, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(-360 * percentage), true);
        //this.actionProgressArc.slice(130, 0, 30, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(125));
        this.actionArc.closePath();
        this.actionArc.fillPath();
    }

    UpdateHP(percentage) {
        this.hpArc.clear();
        this.hpArc.fillStyle(0x02d11e, 1);
        this.hpArc.moveTo(90, 20);
        this.hpArc.arc(90, 20, 25, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(-360 * percentage), true);
        this.hpArc.closePath();
        this.hpArc.fillPath();
    }
}