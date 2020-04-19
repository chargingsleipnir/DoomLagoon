var MainMenu = (() => {
    
    var dispName;

    var elem_Container;

    var btn_StartGame;

    var input_SlotName;
    var input_Password;

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
                GameAudio.SFXPlay("click");
                GameAudio.FadeOut(0.5, () => {
                    OptionsMenu.RemovePreludeBtn();
                    // Hide main menu & launch canvas/phaser game
                    Utility.html.ElemHideRear(elem_Container);
                    Utility.html.ElemShowMiddle(document.getElementById("FullGameContainer"));
                    // Launching of first scene happens in post Boot callback, in Main.js
                    new Phaser.Game(Main.phaserConfig);
                });         
            });

            document.getElementById('MainMenuOptionsBtn').addEventListener("click", () => {
                GameAudio.SFXPlay("click");
                OptionsMenu.Open();
            });

            // SAVE OPTIONS =================================================================

            // BROWSER SAVING
            if (typeof (Storage) === undefined) {
                var checkbox_LocalSaveAvail = document.getElementById('LocalSaveAvailCheckbox');
                checkbox_LocalSaveAvail.parentNode.removeChild(checkbox_LocalSaveAvail);
            }
            else {
                var text_LocalSaveUnavail = document.getElementById('LocalSaveUnavailText');
                if(text_LocalSaveUnavail) {
                    text_LocalSaveUnavail.parentNode.removeChild(text_LocalSaveUnavail);
                }

                // Check for existing game save key, and if it exists, check the box.
                var localStoreDataExists = !!localStorage.getItem(Network.LOCAL_STORAGE_KEY);
                var localSaveCheckbox = document.getElementById('LocalSaveCheck');
                Main.userPrefs.useLocalStorage = localSaveCheckbox.checked = localStoreDataExists;

                localSaveCheckbox.addEventListener('change', (e) => {
                    GameAudio.SFXPlay("click");

                    // If it's ever unchecked, let the user know that any local save data will be erased (if any is there)
                    if(localStoreDataExists && e.currentTarget.checked == false) {
                        var confirmCheck = confirm("This will erase all locally saved data.");
                        if(confirmCheck) {
                            Main.userPrefs.useLocalStorage = e.currentTarget.checked = false;
                            localStorage.removeItem(Network.LOCAL_STORAGE_KEY);
                        }
                        else {
                            Main.userPrefs.useLocalStorage = e.currentTarget.checked = true;
                        }
                    }
                    else {
                        Main.userPrefs.useLocalStorage = e.currentTarget.checked;
                    }                  
                });
            }

            // DATABASE SAVING
            input_SlotName = document.getElementById("SlotName"),
            input_Password = document.getElementById("Password");

            var saveSlotMsg = document.getElementById("SaveSlotMessage");
            var saveSlotData = document.getElementById("SaveSlotData");
            var saveSlotGridX = document.getElementById("SaveSlotGridX");
            var saveSlotGridY = document.getElementById("SaveSlotGridY");
            var saveSlotEquip = document.getElementById("SaveSlotEquip");
            var saveSlotAbility = document.getElementById("SaveSlotAbility");

            var timeoutHdlr;
            function ResetSlotInfo() {
                clearTimeout(timeoutHdlr);
                timeoutHdlr = setTimeout(() => {
                    saveSlotMsg.innerHTML = "";
                }, 4000);
            }

            function UpdateSlotData(gridPos = { x: "-", y: "-"}, upgrades = { equip: 0, ability: 0 }) {
                // TAG: Save location disabled
                //saveSlotGridX.innerHTML = gridPos.x;
                //saveSlotGridY.innerHTML = gridPos.y;

                var rank = "Fighter"
                if(upgrades.equip == Consts.equipmentUpgrades.LORD)
                    rank = "Lord"
                else if(upgrades.equip == Consts.equipmentUpgrades.GENERAL)
                    rank = "General"

                saveSlotEquip.innerHTML = rank;
                saveSlotAbility.innerHTML = upgrades.ability + 1;
            }

            // TODO: If they do this during gameplay, the player/game needs to be updated to match database information
            Network.CreateResponse("RecLoadSlot", (recObj) => {
                console.log("Load slot successful: ", recObj.success);

                if(recObj.success) {
                    Main.userPrefs.useDBStorage = true;
                    saveSlotData.classList.remove("hide");
                    UpdateSlotData(recObj.gridPos || { x: "-", y: "-"}, recObj.upgrades || { equip: 0, ability: 0 });

                    saveSlotMsg.classList.add("success");
                    saveSlotMsg.innerHTML = "Loaded save data."
                }
                else {
                    saveSlotMsg.classList.remove("success");
                    saveSlotMsg.innerHTML = "Could not load save data with that slot name."
                }

                ResetSlotInfo();
            });
            Network.CreateResponse("RecCreateSlot", (success) => {
                console.log("Create slot successful: ", success);

                if(success) {
                    Main.userPrefs.useDBStorage = true;
                    saveSlotData.classList.remove("hide");
                    UpdateSlotData();

                    saveSlotMsg.classList.add("success");
                    saveSlotMsg.innerHTML = "New slot added."
                }
                else {
                    saveSlotMsg.classList.remove("success");
                    saveSlotMsg.innerHTML = "That slot name is already taken."
                }

                ResetSlotInfo();
            });
            Network.CreateResponse("RecEraseSlot", (recObj) => {
                console.log("Erase slot successful: ", recObj.success);

                if(recObj.activeSlot) {
                    Main.userPrefs.useDBStorage = false;
                    saveSlotData.classList.add("hide");
                    UpdateSlotData();
                }

                if(recObj.success) {
                    saveSlotMsg.classList.add("success");
                    saveSlotMsg.innerHTML = "Save slot erased."
                }
                else {
                    saveSlotMsg.classList.remove("success");
                    saveSlotMsg.innerHTML = "There is no slot with that name/password."
                }

                ResetSlotInfo();
            });

            document.getElementById('LoadSlotBtn').addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                Network.Emit("ReqLoadSlot", {
                    username: input_SlotName.value,
                    password: input_Password.value
                });
            });
            document.getElementById('CreateSlotBtn').addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                if(input_SlotName.checkValidity() && input_Password.checkValidity()) {
                    Network.Emit("ReqCreateSlot", {
                        username: input_SlotName.value,
                        password: input_Password.value
                    });
                }
            });
            document.getElementById('EraseSlotBtn').addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                Network.Emit("ReqEraseSlot", {
                    username: input_SlotName.value,
                    password: input_Password.value
                });
            });

            MainMenu.Open();
        },
        GetDispName: () => {
            return dispName || "I am Error";
        },
        Open: () => {
            Utility.html.ElemShowFront(elem_Container);
        }
    }
})();