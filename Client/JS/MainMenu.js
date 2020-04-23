var MainMenu = (() => {
    
    var dispName;
    var btn_StartGame;
    var btn_Options;

    return {
        Init: () => {
            document.getElementById('DispNameField').addEventListener("keyup", (e) => {
                dispName = e.currentTarget.value;
                // Cannot play without at least one character name
                if (e.currentTarget.value == '') {
                    btn_StartGame.disabled = true;
                    btn_StartGame.parentElement.classList.add("disabled");
                }
                else {
                    btn_StartGame.disabled = false;
                    btn_StartGame.parentElement.classList.remove("disabled");
                }
            });

            btn_StartGame = document.getElementById('StartBtn');
            btn_StartGame.addEventListener("click", (e) => {
                btn_StartGame.blur();
                btn_StartGame.disabled = true;
                btn_Options.disabled = true;
                OptionsMenu.EnteringGame();
                GameAudio.SFXPlay("click");
                GameAudio.FadeOut(0.5, () => {
                    OptionsMenu.RemovePreludeBtn();
                    // Hide main menu & launch canvas/phaser game
                    Utility.html.ElemHideRear(document.getElementById("MainMenu"));
                    Utility.html.ElemShowMiddle(document.getElementById("FullGameContainer"));
                    // Launching of first scene happens in post Boot callback, in Main.js
                    new Phaser.Game(Main.phaserConfig);
                });         
            });

            btn_Options = document.getElementById('MainMenuOptionsBtn');
            btn_Options.addEventListener("click", () => {
                GameAudio.SFXPlay("click");
                OptionsMenu.Open();
            });
        },
        GetDispName: () => {
            return dispName || "I am Error";
        }
    }
})();