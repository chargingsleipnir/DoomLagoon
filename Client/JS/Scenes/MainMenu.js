class MainMenu extends Phaser.Scene {
    
    input_Username;
    input_Password;

    cont_MainMenu;
    cont_OptionsMenu;
    cont_Game;
    cont_BarMenu;
    dispName;

    btn_Options;
    btn_CloseOptions;
    btn_StartGame;
    text_LocalSaveAvail;

    isOptionsMenuOpen;

    doSaveLocally;

    constructor() {
        super("MainMenu");
    }

    // Init()
    // Preload()
    // Create()
    // Update()

    init() {
        this.input_Username = document.getElementById("Username"),
        this.input_Password = document.getElementById("Password");

        this.cont_MainMenu = document.getElementById("mainMenu");
        this.cont_OptionsMenu = document.getElementById('optionsMenu');
        this.cont_Game = document.getElementById("fullGameContainer");
        this.cont_BarMenu = document.getElementById('inGameBarMenu');

        document.getElementById('DispNameField').addEventListener("keyup", (e) => {
            this.dispName = e.target.value;
            // Cannot play without at least one character name
            if (e.target.value == '') {
                this.btn_StartGame.disabled = true;
            }
            else {
                this.btn_StartGame.disabled = false;
            }
        });

        this.btn_StartGame = document.getElementById('StartBtn').addEventListener("click", (e) => {
            // Check local storage, databse info, etc. to pass to play state
            Network.CreateResponse("WorldInitData", function (data) {
                // TODO: transfer data forward as in old phaser
                this.scene.start("Title");
                //game.state.start('play', true, false, data);
            });
            Network.Emit("RequestWorldData");
        });

        this.btn_Options = document.getElementById('OptionsBtn');
        this.btn_Options.addEventListener("click", (e) => {
            Utility.html.ElemHideRear(this.cont_MainMenu);
            Utility.html.ElemShowFront(this.cont_OptionsMenu);
            this.isOptionsMenuOpen = true;
        });

        this.btn_CloseOptions = document.getElementById('closeOptionsBtn');
        this.text_LocalSaveAvail = document.getElementById('LocalSaveAvailText');

        var checkbox_LocalSave = document.getElementById('UseLocalSavingOption');
        
        this.doSaveLocally = false;

        if (Main.CanSaveLocal) {
            this.text_LocalSaveAvail.innerHTML = "Available";
            checkbox_LocalSave.addEventListener('change', (e) => {
                this.doSaveLocally = e.target.checked;
            });
        }
        else {
            this.text_LocalSaveAvail.innerHTML = "Unavailable";
            checkbox_LocalSave.parentNode.removeChild(checkbox_LocalSave);
        }

        Network.CreateResponse("SignInResponse", (success) => { });
        Network.CreateResponse("SignUpResponse", (success) => { });
        Network.CreateResponse("RemoveAccountResponse", (success) => { });

        document.getElementById('SignInBtn').addEventListener('click', (e) => {
            Network.Emit("SignIn", {
                username: this.input_Username.value,
                password: this.input_Password.value
            });
        });
        document.getElementById('SignUpBtn').addEventListener('click', (e) => {
            Network.Emit("SignUp", {
                username: this.input_Username.value,
                password: this.input_Password.value
            });
        });
        document.getElementById('RemoveAccountBtn').addEventListener('click', (e) => {
            Network.Emit("RemoveAccount", {
                username: this.input_Username.value,
                password: this.input_Password.value
            });
        });
        
        this.isOptionsMenuOpen = false;

        // TODO: This was old and left commented, not sure if it's still required, especially here. Perhaps in "init" of "Overworld"?
        // Send canvas click position to the server
        // function GetPosition(event) {
        //     var posParent = ElemPosition(event.currentTarget);
        //     var posX = event.clientX - posParent.x;
        //     var posY = event.clientY - posParent.y;
        //     socket.emit("CanvasClick", { x: posX, y: posY });
        // }

        // function ElemPosition(elem) {
        //     var posX = 0;
        //     var posY = 0;
        
        //     while (elem) {
        //         if (elem.tagName == "BODY") {
        //             // deal with browser quirks with body/window/document and page scroll
        //             var xScrollPos = elem.scrollLeft || document.documentElement.scrollLeft;
        //             var yScrollPos = elem.scrollTop || document.documentElement.scrollTop;
                
        //             posX += (elem.offsetLeft - xScrollPos + elem.clientLeft);
        //             posY += (elem.offsetTop - yScrollPos + elem.clientTop);
        //         }
        //         else {
        //             posX += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
        //             posY += (elem.offsetTop - elem.scrollTop + elem.clientTop);
        //         }
            
        //         elem = elem.offsetParent;
        //     }
        //     return {
        //         x: posX,
        //         y: posY
        //     };
        // }
        // game.canvas.addEventListener("click", GetPosition, false);
    }

    preload ()
    {
        
    }

    create ()
    {
        // Set canvas div as parent of options menu to maintain containment throughout game.
        this.cont_Game.appendChild(this.cont_OptionsMenu);
        this.cont_BarMenu.appendChild(this.btn_Options);
        //cont_OptionsMenu.className += ' newOptionsMenuStyles';
        
        this.btn_Options.onclick = function () { this.isOptionsMenuOpen ? menuState.OptionsOff() : menuState.OptionsOn(); }
        this.btn_CloseOptions.onclick = this.OptionsOff;
        //btn_CloseOptions.parentNode.removeChild(btn_CloseOptions);
        
        Utility.html.ElemHideRear(this.cont_OptionsMenu);
        Utility.html.ElemHideRear(this.cont_MainMenu);
        Utility.html.ElemShowMiddle(this.cont_Game);
    }

    static get GetDispName () {
        return this.dispName || "I am Error";
    }

    static OptionsOn () {
        Utility.html.ElemShowFront(this.cont_OptionsMenu);
        this.isOptionsMenuOpen = true;
    }
    static OptionsOff () {
        Utility.html.ElemHideRear(this.cont_OptionsMenu);
        this.isOptionsMenuOpen = false;
    }
    static OptionsOffMainOn () {
        Utility.html.ElemHideRear(this.cont_OptionsMenu);
        Utility.html.ElemShowFront(this.cont_MainMenu);
        this.isOptionsMenuOpen = false;
    }

    static OpenOptionFromSet(elem, id) {
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
}