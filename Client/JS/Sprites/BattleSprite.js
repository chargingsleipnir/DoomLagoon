class BattleSprite {

    scene;
    sprite;

    idlePos;
    offScreenX;
    spriteSkinName;

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
    }

    EnterBattle(delay, duration) {
        const battleEnterConfig = { ease: 'Back', from: this.offScreenX, start: this.offScreenX, to: this.idlePos.x };
        this.scene.tweens.add({
            delay: delay,
            duration: duration,
            x: battleEnterConfig,
            targets: this.sprite
        });
    }

    ExitBattle(delay, duration) {
        const battleEnterConfig = { ease: 'Back', from: this.idlePos.x, start: this.idlePos.x, to: this.offScreenX };
        this.scene.tweens.add({
            delay: delay,
            duration: duration,
            x: battleEnterConfig,
            targets: this.sprite
        });
    }

    Anim_Stop() {

    }

    Anim_Play() {

    }
}