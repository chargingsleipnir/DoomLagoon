var MainMenu = (() => {
    
    var dispName;

    var elem_Container;

    var btn_StartGame;

    return {
        Init: () => {
            elem_Container = document.getElementById("MainMenu");

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

                // Hide main menu & launch canvas/phaser game
                Utility.html.ElemHideRear(elem_Container);
                Utility.html.ElemShowMiddle(document.getElementById("FullGameContainer"));

                // Launching of first scene happens in post Boot callback, in Main.js
                new Phaser.Game(Main.phaserConfig);
            });

            document.getElementById('MainMenuOptionsBtn').addEventListener("click", OptionsMenu.Open);
        },
        GetDispName: () => {
            return dispName || "I am Error";
        },
        Open: () => {
            Utility.html.ElemShowFront(elem_Container);
        }
    }
})();