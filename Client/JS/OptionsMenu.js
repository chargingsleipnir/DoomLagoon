var OptionsMenu = (() => {

    var elem_Container;
    var elems_tab;
    var elems_panel;

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

            // AUDIO OPTIONS
            document.getElementById('VolumeSlider').addEventListener('change', (e) => {
                Main.userPrefs.volumePct = e.currentTarget.value;
                // TODO: Adjust audio output right here
            });
        },
        Open: () => {
            Utility.html.ElemShowFront(elem_Container, 2);
        }
    }
})();