class OptionsMenu extends Phaser.Scene {

    static elem_Container;
    elems_tab;
    elems_panel;

    text_LocalSaveAvail;
    doSaveLocally;
    
    constructor() {
        super("OptionsMenu");
    }

    init() {
        OptionsMenu.elem_Container = document.getElementById('OptionsMenu');

        document.getElementById('CloseOptionsBtn').addEventListener('click', () => {
            Utility.html.ElemHideRear(OptionsMenu.elem_Container);
            MainMenu.ShowSelf();
            this.isOptionsMenuOpen = false;
        });

        this.elems_tab = document.getElementById("OptionsMenuTabs").getElementsByTagName("button");
        for(let tab of this.elems_tab) {
            tab.addEventListener('click', (e) => {
                this.OpenOptionFromSet(e.currentTarget, e.currentTarget.dataset.panelId);
            });
        }

        this.elems_panel = OptionsMenu.elem_Container.getElementsByClassName("optionPanel");

        this.text_LocalSaveAvail = document.getElementById('LocalSaveAvailText');
        var checkbox_LocalSave = document.getElementById('UseLocalSavingOption');
        
        this.doSaveLocally = false;
        if (Main.CanSaveLocal) {
            this.text_LocalSaveAvail.innerHTML = "Available";
            checkbox_LocalSave.addEventListener('change', (e) => {
                this.doSaveLocally = e.currentTarget.checked;
            });
        }
        else {
            this.text_LocalSaveAvail.innerHTML = "Unavailable";
            checkbox_LocalSave.parentNode.removeChild(checkbox_LocalSave);
        }
    }

    preload ()
    {

    }

    create ()
    {
        OptionsMenu.ShowSelf();
    }

    OpenOptionFromSet(tabElem, panelId) {
        // Show the clicked tab as the active one
        for (let i = 0; i < this.elems_tab.length; i++) {
            this.elems_tab[i].classList.remove("active"); 
        }
        tabElem.classList.add("active");

        // Show only the corresponding panel
        for (let i = 0; i < this.elems_panel.length; i++) {
            if(this.elems_panel[i].id == panelId)
                this.elems_panel[i].classList.add("active");
            else
                this.elems_panel[i].classList.remove("active");
        }
    }

    static ShowSelf() {
        Utility.html.ElemShowFront(OptionsMenu.elem_Container);
    }
}