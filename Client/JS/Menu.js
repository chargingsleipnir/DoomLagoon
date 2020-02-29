
var menuState = (function () {
    
    var username,
        password;
    
    var cont_MainMenu,
        cont_OptionsMenu,
        cont_Game,
        cont_BarMenu,
        input_DispName,
        btn_Options,
        btn_CloseOptions,
        btn_StartGame;
    
    var isOptionsMenuOpen;
    
    return {
        create: function () {
            username = document.getElementById("username"),
            password = document.getElementById("password");

            cont_MainMenu = document.getElementById("mainMenu");
            cont_OptionsMenu = document.getElementById('optionsMenu');
            cont_Game = document.getElementById("fullGameContainer");
            cont_BarMenu = document.getElementById('inGameBarMenu');

            input_DispName = document.getElementById('dispNameField');

            btn_Options = document.getElementById('optionsBtn');
            btn_CloseOptions = document.getElementById('closeOptionsBtn');
            btn_StartGame = document.getElementById('startBtn');
            
            var checkbox_LocalSave = document.getElementById('useLocalSavingOption');
            if (!canSaveLocal)
                checkbox_LocalSave.parentNode.removeChild(checkbox_LocalSave);
            
            isOptionsMenuOpen = false;
            
            function SignInCallback(success) {
                return;
                if (success) {

                }
                else {

                }
            }
            function SignUpCallback(success) {
                return;
                if (success) {

                }
                else {

                }
            }
            function RemoveAccountCallback(success) {
                return;
                if (success) {

                }
                else {
                    
                }
            }
            
            Network.CreateResponse("SignInResponse", SignInCallback);
            Network.CreateResponse("SignUpResponse", SignUpCallback);
            Network.CreateResponse("RemoveAccountResponse", RemoveAccountCallback);
        },
        ChangeName: function () {
            if (input_DispName.value == '')
                btn_StartGame.disabled = true;
            else
                btn_StartGame.disabled = false;
        },
        GetDispName: function () {
            return input_DispName.value;
        },
        SignIn: function () {
            return;
            Network.Emit("SignIn", {
                username: username.value,
                password: password.value
            });
        },
        SignUp: function () {
            return;
            Network.Emit("SignUp", {
                username: username.value,
                password: password.value
            });
        },
        RemoveAccount: function () {
            return;
            Network.Emit("RemoveAccount", {
                username: username.value,
                password: password.value
            });
        },
        OptionsOn: function () {
            Utility.html.ElemShowFront(cont_OptionsMenu);
            isOptionsMenuOpen = true;
        },
        OptionsOff: function () {
            Utility.html.ElemHideRear(cont_OptionsMenu);
            isOptionsMenuOpen = false;
        },
        OptionsOnMainOff: function () {
            Utility.html.ElemHideRear(cont_MainMenu);
            Utility.html.ElemShowFront(cont_OptionsMenu);
            isOptionsMenuOpen = true;
        },
        OptionsOffMainOn: function () {
            Utility.html.ElemHideRear(cont_OptionsMenu);
            Utility.html.ElemShowFront(cont_MainMenu);
            isOptionsMenuOpen = false;
        },
        Start: function () {
            // Set canvas div as parent of options menu to maintain containment throughout game.
            cont_Game.appendChild(cont_OptionsMenu);
            cont_BarMenu.appendChild(btn_Options);
            //cont_OptionsMenu.className += ' newOptionsMenuStyles';
            
            btn_Options.onclick = function () { isOptionsMenuOpen ? menuState.OptionsOff() : menuState.OptionsOn(); }
            btn_CloseOptions.onclick = this.OptionsOff;
            //btn_CloseOptions.parentNode.removeChild(btn_CloseOptions);
            
            Utility.html.ElemHideRear(cont_OptionsMenu);
            Utility.html.ElemHideRear(cont_MainMenu);
            Utility.html.ElemShowMiddle(cont_Game);
            
            game.state.start('load');
        }
    }
})();

function OpenOptionFromSet(elem, id) {
    var i,
        tabContent, 
        tabLinks;
    
    // Make all tabs display nothing for now
    tabContent = document.getElementsByClassName("tabContent");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    
    // Get all elements with class="tabLink" and remove the class "active"
    tabLinks = document.getElementsByClassName("tabLink");
    for (i = 0; i < tabLinks.length; i++) {
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    }
    
    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(id).style.display = "block";
    elem.className += " active";
}