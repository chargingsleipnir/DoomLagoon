
var Network = (() => {

    var socket;

    return {
        InitSocketConnection: function (Callback) {
            // ESTABLISH CONNECTION
            try {
                socket = io();
                socket.on('connect', function () {
                    console.log("Socket connected: " + socket.connected);
                    console.log("Client side socket id: " + socket.id);
                    Callback();
                });
            }
            catch (err) {
                // TODO
            }
        },
        CreateResponse: function (str_Name, Callback) {
            socket.on(str_Name, Callback);
        },
        Emit: function (str_Name, data) {
            socket.emit(str_Name, data);
        },
        GetSocketID: function () {
            return socket.id;
        },
        LOCAL_STORAGE_KEY: "LocalSaveSlot"
    };
})();