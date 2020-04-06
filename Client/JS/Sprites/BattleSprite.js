class BattleSprite {

    scene;
    sprite;

    idlePos;
    offScreenX;
    spriteSkinName;

    inBattle;

    constructor(scene, idlePos, offScreenX, spriteSkinName, flipX = false) {
        this.scene = scene;
        this.idlePos = idlePos;
        this.offScreenX = offScreenX;
        this.spriteSkinName = spriteSkinName;

        // TODO: Start off screen
        this.sprite = scene.add.sprite(this.offScreenX, this.idlePos.y, Main.animData.battle.skinPrefix + spriteSkinName , 0);
        this.sprite.setScale(1.75);
        this.sprite.anims.play(spriteSkinName + '_Battle_Idle');

        if(flipX)
            this.sprite.flipX = true;

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
            targets: this.sprite
        });
    }

    ExitBattle(delay, duration) {
        this.inBattle = false;
        const battleEnterConfig = { ease: 'Back', from: this.idlePos.x, start: this.idlePos.x, to: this.offScreenX };
        this.scene.tweens.add({
            delay: delay,
            duration: duration,
            x: battleEnterConfig,
            targets: this.sprite
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
}