var OptionsMenu = (() => {

    var elem_Container;
    var elems_tab;
    var elems_panel;

    var input_Username;
    var input_Password; 

    function OpenOptionFromSet(tabElem, panelId) {
        // Show the clicked tab as the active one
        for (let i = 0; i < elems_tab.length; i++) {
            elems_tab[i].classList.remove("active"); 
        }
        tabElem.classList.add("active");

        // Show only the corresponding panel
        for (let i = 0; i < elems_panel.length; i++) {
            if(elems_panel[i].id == panelId)
                elems_panel[i].classList.add("active");
            else
                elems_panel[i].classList.remove("active");
        }
    }
    
    return {
        Init: () => {
            elem_Container = document.getElementById('OptionsMenu');

            document.getElementById('CloseOptionsBtn').addEventListener('click', () => {
                Utility.html.ElemHideRear(elem_Container);
            });

            elems_tab = document.getElementById("OptionsMenuTabs").getElementsByTagName("button");
            for(let tab of elems_tab) {
                tab.addEventListener('click', (e) => {
                    OpenOptionFromSet(e.currentTarget, e.currentTarget.dataset.panelId);
                });
            }

            elems_panel = elem_Container.getElementsByClassName("optionPanel");

            var text_LocalSaveAvail = document.getElementById('LocalSaveAvailText');
            var checkbox_LocalSave = document.getElementById('UseLocalSavingOption');
            
            if (Network.CanSaveLocal()) {
                text_LocalSaveAvail.innerHTML = "Available";
                checkbox_LocalSave.addEventListener('change', (e) => {
                    User.prefs.useLocalStorage = e.currentTarget.checked;
                });
            }
            else {
                text_LocalSaveAvail.innerHTML = "Unavailable";
                checkbox_LocalSave.parentNode.removeChild(checkbox_LocalSave);
            }

            // DATABASE SAVING
            input_Username = document.getElementById("Username"),
            input_Password = document.getElementById("Password");

            // TODO: If they do this during gameplay, the player/game needs to be updated to match database information
            Network.CreateResponse("RecSignIn", (success) => {
                console.log("Sign-in successful: ", success);
            });
            Network.CreateResponse("RecSignUp", (success) => {
                console.log("Sign-up successful: ", success);
            });
            Network.CreateResponse("RecRemoveAccount", (success) => {
                console.log("Account deleted: ", success);
                // TODO: The whole browser window should probably be rest to reflect lack of save state
            });

            document.getElementById('SignInBtn').addEventListener('click', (e) => {
                Network.Emit("ReqSignIn", {
                    username: input_Username.value,
                    password: input_Password.value
                });
            });
            document.getElementById('SignUpBtn').addEventListener('click', (e) => {
                Network.Emit("ReqSignUp", {
                    username: input_Username.value,
                    password: input_Password.value
                });
            });
            document.getElementById('RemoveAccountBtn').addEventListener('click', (e) => {
                Network.Emit("ReqRemoveAccount", {
                    username: input_Username.value,
                    password: input_Password.value
                });
            });

            // AUDIO OPTIONS
            document.getElementById('VolumeSlider').addEventListener('change', (e) => {
                User.prefs.volumePct = e.currentTarget.value;
            });
        },
        Open: () => {
            Utility.html.ElemShowFront(elem_Container, 2);
        }
    }
})();