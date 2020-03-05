//* This class more about the actual Phaser player-character. See "User" for game prefs & meta info.

class LocalPlayer extends NetPlayer {

    static elem_ChatSendBtn;

    static imageKeysArr = [
        'navBoatLeft',
        'navBoatRight',
        'navBoatUp',
        'navBoatDown'
    ];

    constructor(scene, initGridPos) {
        super(scene, initGridPos, LocalPlayer.imageKeysArr, MainMenu.GetDispName(), Network.GetSocketID());

        var elem_ChatTextInput = document.getElementById("PlayerChatMsg");
        document.getElementById("PlayerChatSendMsgBtn").addEventListener('click', (e) => {
            console.log("Chat from player: " + elem_ChatTextInput.value);
            // TODO: send elem_ChatTextInput.value to some sort of chat system. (Player speach bubbles!)
            //* Such implementation should exist on NPC level
        });
    }

    static LoadImages(scene) {
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.LEFT], '../../Assets/Sprites/boatPH_Left.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.RIGHT], '../../Assets/Sprites/boatPH_Right.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.UP], '../../Assets/Sprites/boatPH_Up.jpg');
        scene.load.image(LocalPlayer.imageKeysArr[Constants.DIR_IMG.DOWN], '../../Assets/Sprites/boatPH_Down.jpg');
    }
}