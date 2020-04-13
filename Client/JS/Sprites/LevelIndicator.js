// TODO: Power will start at 1, and increase to 5 by adding equip & ability levels
// TODO: Speed will start at 3, and increase with each equip level, but decrease with each ability level.
// Thus, the Fighter's speeds can range 1 - 3, Lord's 2 - 4, and Knight's 3 - 5.

class LevelIndicator {

    xOffset;
    topY;
    initFrameGap;
    fillColour;
    baseline;
    fillSlots = [];

    constructor(scene, container, xOffset, titleText, fillColour, baseline = 1) {
        this.xOffset = xOffset;
        this.fillColour = fillColour;
        this.baseline = baseline;

        this.topY = -28;
        this.initFrameGap = 13;


        let headerText = scene.add.text(xOffset, this.topY, titleText, Consts.STYLE_BATTLE_GUI_SUBTITLE);
        headerText.setOrigin(0.5);
        container.add(headerText);
        
        for(let i = 0; i < Consts.ABILITY_LEVEL_MAX; i++) {
            var levelEmptyFrame = scene.add.graphics();
            levelEmptyFrame.fillStyle(0x000000, 1);
            container.add(levelEmptyFrame);

            var gaps = Consts.ABILITY_LEVEL_GAP * i;
            var heights = i * 8;
            levelEmptyFrame.fillRect(
                xOffset - 15, 
                this.topY + this.initFrameGap + gaps + heights, 
                30, 
                8
            );


            let initFillGap = 2;
            let fillGap = 4;
            this.fillSlots.push(scene.add.graphics());
            this.fillSlots[i].fillStyle(Consts.ABILITY_LEVEL_EMPTY_FILL, 1);
            container.add(this.fillSlots[i]);

            gaps = (Consts.ABILITY_LEVEL_GAP + fillGap) * i;
            heights = i * 4;
            this.fillSlots[i].fillRect(
                xOffset - 14, 
                this.topY + this.initFrameGap + initFillGap + gaps + heights, 
                28, 
                4
            );
        }

        this.FillFromBaseline();
    }

    FillTo(level) {
        let skip = Consts.ABILITY_LEVEL_MAX - level;

        for(let i = 0; i < Consts.ABILITY_LEVEL_MAX; i++) {
            this.fillSlots[i].clear();

            if(i < skip)
                this.fillSlots[i].fillStyle(Consts.ABILITY_LEVEL_EMPTY_FILL, 1);
            else
                this.fillSlots[i].fillStyle(this.fillColour, 1);

            let initFillGap = 2;
            let fillGap = 4;

            let gaps = (Consts.ABILITY_LEVEL_GAP + fillGap) * i;
            let heights = i * 4;
            this.fillSlots[i].fillRect(
                this.xOffset - 14, 
                this.topY + this.initFrameGap + initFillGap + gaps + heights, 
                28, 
                4
            );
        }
    }

    FillFromBaseline(levelDiff = 0) {
        this.FillTo(this.baseline + levelDiff);
    }
}