class MainMenu extends Phaser.Scene {
    
    dispName;

    static elem_Container;

    input_Username;
    input_Password; 

    btn_Options;
    btn_StartGame;

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

        MainMenu.elem_Container = document.getElementById("MainMenu");

        document.getElementById('DispNameField').addEventListener("keyup", (e) => {
            this.dispName = e.currentTarget.value;
            // Cannot play without at least one character name
            if (e.currentTarget.value == '') {
                this.btn_StartGame.disabled = true;
                this.btn_StartGame.parentElement.classList.add("disabled");
            }
            else {
                this.btn_StartGame.disabled = false;
                this.btn_StartGame.parentElement.classList.remove("disabled");
            }
        });

        this.btn_StartGame = document.getElementById('StartBtn');
        this.btn_StartGame.addEventListener("click", (e) => {
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


            // TODO: Make this work additively if possible, so "init" and "create" only runs once.
            // 

            this.scene.start("OptionsMenu");
            //OptionsMenu.ShowSelf();
            Utility.html.ElemHideRear(MainMenu.elem_Container);
        });

        

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

    }

    static get GetDispName () {
        return this.dispName || "I am Error";
    }

    static ShowSelf() {
        Utility.html.ElemShowFront(MainMenu.elem_Container);
    }
}