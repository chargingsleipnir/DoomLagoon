class ProgIndr {

    static get leftBlockSpace() { return 155; }

    static get sectionGap() { return 5; }

    static get frameW() { return 70; }
    static get frameH() { return 22; }
    static get frameThickness() { return 2; }

    static get barW() { return 66; }
    static get barH() { return 8; }
    static get hpDispIncrement() { return 1; }

    constructor(scene, container, xOffset, yOffset, name) {

        this.nameText = scene.add.text(xOffset, yOffset, name, Consts.STYLE_BATTLE_GUI_DETAILS);
        this.nameText.setOrigin(0, 0.5);
        container.add(this.nameText);

        this.hpCurrText = scene.add.text(xOffset + ProgIndr.leftBlockSpace, yOffset, "999", Consts.STYLE_BATTLE_GUI_DETAILS);
        this.hpCurrText.setOrigin(1.0, 0.5);
        container.add(this.hpCurrText);

        // ======= BARS

        this.barFrame = scene.add.graphics();
        this.barFrame.fillStyle(0x000000, 1);
        this.barFrame.setPosition(xOffset + ProgIndr.leftBlockSpace + ProgIndr.sectionGap, yOffset - (ProgIndr.frameH * 0.5));
        this.barFrame.fillRect(0, 0, ProgIndr.frameW, ProgIndr.frameH);
        container.add(this.barFrame);

        // Action Bar

        this.actionBarBG = scene.add.graphics();
        this.actionBarBG.fillStyle(0x999999, 1);
        this.actionBarBG.setPosition(this.barFrame.x + ProgIndr.frameThickness, this.barFrame.y + ProgIndr.frameThickness);
        this.actionBarBG.fillRect(0, 0, ProgIndr.barW, ProgIndr.barH );
        container.add(this.actionBarBG);

        this.actionBar = scene.add.graphics();
        this.actionBar.setPosition(this.actionBarBG.x, this.actionBarBG.y);
        container.add(this.actionBar);

        // HP Bar

        this.hpBarBG = scene.add.graphics();
        this.hpBarBG.fillStyle(0x800303, 1);
        this.hpBarBG.setPosition(this.barFrame.x + ProgIndr.frameThickness, this.barFrame.y + (ProgIndr.frameThickness * 2) + ProgIndr.barH);
        this.hpBarBG.fillRect(0, 0, ProgIndr.barW, ProgIndr.barH);
        container.add(this.hpBarBG);

        this.hpBar = scene.add.graphics();
        this.hpBar.setPosition(this.hpBarBG.x, this.hpBarBG.y);
        container.add(this.hpBar);

        this.hpPctFrom = this.hpPctTo = 100;
        this.hpChangeFactor = -1;
        this.DrawHP(this.hpPctTo);
    }

    SetTemplate(name, hpCurr, hpMax) {
        this.nameText.setText(name);
        this.UpdateHPByCurrMax(hpCurr, hpMax);
        this.DrawHP(this.hpPctTo);
    }

    SetActive(isActive) {
        var alpha = isActive ? 1 : 0;
        this.nameText.setAlpha(alpha);
        this.hpCurrText.setAlpha(alpha);
        this.barFrame.setAlpha(alpha);
        this.actionBarBG.setAlpha(alpha);
        this.actionBar.setAlpha(alpha);
        this.hpBarBG.setAlpha(alpha);
        this.hpBar.setAlpha(alpha);
    }

    DrawHP(percentage) {
        this.hpBar.clear();
        this.hpBar.fillStyle(0x058003, 1);
        this.hpBar.fillRect(ProgIndr.barW, 0, -(ProgIndr.barW * (percentage * 0.01)), ProgIndr.barH);
    }
    UpdateHPByCurrMax(hpCurr, hpMax) {
        this.hpCurrText.setText(hpCurr);

        this.hpPctFrom = this.hpPctTo;
        this.hpPctTo = Math.floor((hpCurr / hpMax) * 100);

        // Presume to show losing health, but if hp is gained, show increasing health.
        this.hpChangeFactor = -1;
        if(this.hpPctTo > this.hpPctFrom)
            this.hpChangeFactor = 1;
    }

    DrawAction(percentage) {
        this.actionBar.clear();
        this.actionBar.fillStyle(0x004cff, 1);
        this.actionBar.fillRect(0, 0, ProgIndr.barW * (percentage * 0.01), ProgIndr.barH);
    }

    Update() {
        //console.log(`Hp to: ${this.hpPctTo}, from: ${this.hpPctFrom}`);
        if(this.hpPctTo != this.hpPctFrom) {
            this.hpPctFrom += (ProgIndr.hpDispIncrement * this.hpChangeFactor);
            // Safety check to ensure a single frame blip doesn't cause the value to go past the first check and increment forever.
            if(this.hpPctTo - (this.hpPctFrom * this.hpChangeFactor) <= ProgIndr.hpDispIncrement * 2)
                this.hpPctFrom = this.hpPctTo;

            this.DrawHP(this.hpPctFrom);
        }
    }
}