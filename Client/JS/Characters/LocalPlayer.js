//* This class more about the actual Phaser player-character. See "User" for game prefs & meta info.

class LocalPlayer extends NetPlayer {

    static elem_ChatSendBtn;

    constructor(initGridPos, image, name, id) {
        super(initGridPos, image, name, id);

        var elem_ChatTextInput = document.getElementById("PlayerChatMsg");
        document.getElementById("PlayerChatSendMsgBtn").addEventListener('click', (e) => {
            console.log("Chat from player: " + elem_ChatTextInput.value);
            // TODO: send elem_ChatTextInput.value to some sort of chat system. (Player speach bubbles!)
            //* Such implementation should exist on NPC level
        });
    }
}