
var Network = (() => {

    var socket;

    return {
        InitSocketConnection: function (Callback) {
            // ESTABLISH CONNECTION
            try {
                socket = io.connect('127.0.0.1:8000');
                //socket = io.connect('http://doomlagoon-gvd.rhcloud.com:8000');
                socket.on('connect', function () {
                    //console.log("Socket connected: " + socket.connected);
                    //console.log("Client side socket id: " + socket.id);
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
        CanSaveLocal: () => {
            return (typeof (Storage) !== undefined);
        }
    };
})();