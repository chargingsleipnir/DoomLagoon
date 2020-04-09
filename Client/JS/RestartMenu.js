var RestartMenu = (() => {

    var elem_Container;
    
    // TODO: Transition end callback to make it close before resetting game?
    return {
        Init: () => {
            elem_Container = document.getElementById('GameOverMenu');

            // TODO: Everything has been taken care of on the server, just need to figure this out now.
            // For now, just a menu pop-up with a single "Restart" button, which would ideally not refresh the page,
            // but essentially restart everything else (just put the player back at the inital spawn point... or Title scene?)
            document.getElementById("ResetGameBtn").addEventListener("click", () => {
                location.reload();
            });
        },
        Open: () => {
            elem_Container.classList.remove("hidden");
        }
    }
})();