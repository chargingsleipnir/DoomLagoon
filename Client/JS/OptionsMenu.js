var OptionsMenu = (() => {

    var elem_Container;
    var elems_tab;
    var elems_panel;

    var saveBtn;
    var localStoreData;
    var localStoreDataExists;
    var localSaveCheckbox;
    var localStoreEquip;
    var localStoreAbility;

    var saveSlotMsg;
    var saveSlotData;
    //var saveSlotGridX;
    //var saveSlotGridY;
    var saveSlotEquip;
    var saveSlotAbility;

    var input_SlotName;
    var input_Password;

    var initMusicBtn;

    function GetRank(equipLevel) {
        if(equipLevel == Consts.equipmentUpgrades.LORD)
            return "Lord";
        else if(equipLevel == Consts.equipmentUpgrades.GENERAL)
            return "General";

        return "Fighter";
    }

    function CheckLocalStore() {
        localStoreData = JSON.parse(localStorage.getItem(Network.LOCAL_STORAGE_KEY));
        localStoreDataExists = !!localStoreData;
    }
    function UpdateLSSlotData(gridPos, upgrades) {
        // TAG: Save location disabled
        //localStoreGridX.innerHTML = gridPos ? gridPos.x : "-";
        //localStoreGridY.innerHTML = gridPos ? gridPos.y : "-";
        localStoreEquip.innerHTML = upgrades ? GetRank(upgrades.equip) : "-";
        localStoreAbility.innerHTML = upgrades ? upgrades.ability + 1 : "-";
    }

    function UpdateDBSlotData(gridPos, upgrades) {
        // TAG: Save location disabled
        //saveSlotGridX.innerHTML = gridPos ? gridPos.x : "-";
        //saveSlotGridY.innerHTML = gridPos ? gridPos.y : "-";
        saveSlotEquip.innerHTML = upgrades ? GetRank(upgrades.equip) : "-";
        saveSlotAbility.innerHTML = upgrades ? upgrades.ability + 1 : "-";
    }

    function ToggleDispSaveSlotMessage(doDisp) {
        if(doDisp) {
            saveSlotMsg.classList.remove("hide");
            saveSlotData.classList.add("hide");
        }
        else {
            saveSlotMsg.classList.add("hide");
            saveSlotData.classList.remove("hide");
        }
    }

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
                GameAudio.SFXPlay("click");
                Utility.html.ElemHideRear(elem_Container);
                if(Main.game)
                    Main.game.input.keyboard.enabled = true;
            });

            elems_tab = document.getElementById("OptionsMenuTabs").getElementsByTagName("button");
            for(let tab of elems_tab) {
                tab.addEventListener('click', (e) => {
                    GameAudio.SFXPlay("click");
                    OpenOptionFromSet(e.currentTarget, e.currentTarget.dataset.panelId);
                });
            }
            elems_panel = elem_Container.getElementsByClassName("optionPanel");

            
            // SAVE OPTIONS =================================================================

            // Save button
            saveBtn = document.getElementById("SaveBtn");
            saveBtn.addEventListener('click', () => { 
                GameAudio.SFXPlay("click");
                Main.Save();
            });

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
                CheckLocalStore();
                localSaveCheckbox = document.getElementById('LocalSaveCheck');
                Main.userPrefs.useLocalStorage = localSaveCheckbox.checked = localStoreDataExists;

                localStoreEquip = document.getElementById("LocalStorageEquip");
                localStoreAbility = document.getElementById("LocalStorageAbility");

                if(localStoreDataExists)
                    UpdateLSSlotData(localStoreData.orientation, localStoreData.upgrades);

                localSaveCheckbox.addEventListener('change', (e) => {
                    CheckLocalStore();
                    GameAudio.SFXPlay("click");

                    // If it's ever unchecked, let the user know that any local save data will be erased (if any is there)
                    if(e.currentTarget.checked == false) {
                        if(localStoreDataExists) {
                            var confirmCheck = confirm("This will erase all locally saved data.");
                            if(confirmCheck) {
                                Main.userPrefs.useLocalStorage = e.currentTarget.checked = false;
                                localStorage.removeItem(Network.LOCAL_STORAGE_KEY);
                                UpdateLSSlotData();
                            }
                            else {
                                Main.userPrefs.useLocalStorage = e.currentTarget.checked = true;
                            }
                        }
                        else {
                            Main.userPrefs.useLocalStorage = e.currentTarget.checked = false;
                            UpdateLSSlotData();
                        }
                    }
                    else {
                        Main.userPrefs.useLocalStorage = true;
                        // Choosing to save in-game versus from main menu
                        let saveData = Main.player ? Main.player.GetSavePack() : {
                            orientation: { x: -1, y: -1, dir: -1 },
                            upgrades: { equip: 0, ability: 0 }
                        };
                        UpdateLSSlotData(saveData.orientation, saveData.upgrades);
                        localStorage.setItem(Network.LOCAL_STORAGE_KEY, JSON.stringify(saveData));
                    }                  
                });
            }

            // DATABASE SAVING
            input_SlotName = document.getElementById("SlotName"),
            input_Password = document.getElementById("Password");

            saveSlotMsg = document.getElementById("SaveSlotMessage");
            saveSlotData = document.getElementById("SaveSlotData");
            //var saveSlotGridX = document.getElementById("SaveSlotGridX");
            //var saveSlotGridY = document.getElementById("SaveSlotGridY");
            saveSlotEquip = document.getElementById("SaveSlotEquip");
            saveSlotAbility = document.getElementById("SaveSlotAbility");

            var timeoutHdlr;
            function ResetSlotInfo() {
                clearTimeout(timeoutHdlr);
                timeoutHdlr = setTimeout(() => {
                    saveSlotMsg.innerHTML = "";
                    ToggleDispSaveSlotMessage(false);
                }, 2000);
            }

            // TODO: If they do this during gameplay, the player/game needs to be updated to match database information
            Network.CreateResponse("RecLoadSlot", (recObj) => {
                console.log("Load slot successful: ", recObj.success);

                if(recObj.success) {
                    Main.userPrefs.useDBStorage = true;
                    saveSlotData.classList.remove("hide");
                    UpdateDBSlotData(recObj.gridPos, recObj.upgrades);

                    if(Main.player) {
                        saveSlotMsg.classList.remove("success");
                        saveSlotMsg.innerHTML = 'Switched slot. Clicking "Save game" will overwrite data.';
                    }
                    else {
                        saveSlotMsg.classList.add("success");
                        saveSlotMsg.innerHTML = "Loaded save data.";
                    }
                    
                    ToggleDispSaveSlotMessage(true);
                }
                else {
                    saveSlotMsg.classList.remove("success");
                    saveSlotMsg.innerHTML = "Could not load save data with that slot name & password."
                    ToggleDispSaveSlotMessage(true);
                }

                ResetSlotInfo();
            });
            Network.CreateResponse("RecCreateSlot", (recObj) => {
                console.log("Create slot successful: ", recObj.success);

                if(recObj.success) {
                    Main.userPrefs.useDBStorage = true;
                    saveSlotData.classList.remove("hide");

                    UpdateDBSlotData(recObj.orient, recObj.upgrades);

                    saveSlotMsg.classList.add("success");
                    saveSlotMsg.innerHTML = "New slot added."
                    Main.Save();

                    ToggleDispSaveSlotMessage(true);
                }
                else {
                    saveSlotMsg.classList.remove("success");
                    saveSlotMsg.innerHTML = "That slot name is already taken."
                    ToggleDispSaveSlotMessage(true);
                }

                ResetSlotInfo();
            });
            Network.CreateResponse("RecEraseSlot", (recObj) => {
                console.log("Erase slot successful: ", recObj.success);

                if(recObj.activeSlot) {
                    Main.userPrefs.useDBStorage = false;
                    saveSlotData.classList.add("hide");
                    UpdateDBSlotData();
                }

                if(recObj.success) {
                    saveSlotMsg.classList.add("success");
                    saveSlotMsg.innerHTML = "Save slot erased."
                    ToggleDispSaveSlotMessage(true);
                }
                else {
                    saveSlotMsg.classList.remove("success");
                    saveSlotMsg.innerHTML = "There is no slot with that name/password."
                    ToggleDispSaveSlotMessage(true);
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
                        user: {
                            name: input_SlotName.value,
                            password: input_Password.value
                        },
                        slotData: Main.player ? Main.player.GetSavePack() : null
                    });
                }
                else {
                    saveSlotMsg.classList.remove("success");
                    saveSlotMsg.innerHTML = "Valid name and password required."
                    ToggleDispSaveSlotMessage(true);
                    ResetSlotInfo();
                }
            });
            document.getElementById('EraseSlotBtn').addEventListener('click', (e) => {
                GameAudio.SFXPlay("click");
                Network.Emit("ReqEraseSlot", {
                    username: input_SlotName.value,
                    password: input_Password.value
                });
            });

            // AUDIO OPTIONS
            document.getElementById('VolumeSliderMusic').addEventListener('change', (e) => {
                GameAudio.SetVolumeMusic(e.currentTarget.value);
            });
            document.getElementById('VolumeSliderSFX').addEventListener('change', (e) => {
                GameAudio.SetVolumeSFX(e.currentTarget.value);
                GameAudio.SFXPlay("click");
            });

            initMusicBtn = document.getElementById("StartInitialMusicBtn");
            if(initMusicBtn) {
                initMusicBtn.addEventListener('click', (e) => {
                    GameAudio.SFXPlay("click");
                    GameAudio.MusicPlay();
                    initMusicBtn.parentElement.removeChild(initMusicBtn);
                    initMusicBtn = null;
                });
            }

            // Set in starting place
            Utility.html.ElemHideRear(elem_Container);
        },
        Open: () => {
            Utility.html.ElemShowFront(elem_Container, 2);
            if(Main.game)
                Main.game.input.keyboard.enabled = false;
        },
        RemovePreludeBtn: () => {
            if(initMusicBtn) {
                initMusicBtn.parentElement.removeChild(initMusicBtn);
                initMusicBtn = null;
            }
        },
        EnteringGame: () => {
            saveBtn.disabled = false;
        }
    }
})();