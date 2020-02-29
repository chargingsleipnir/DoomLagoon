/*
var mongojs = require('mongojs');
                                                                     SHUT DOWN DATABASE FOR NOW, KNOWING THAT IT WORKS
var dbConnectionString = '127.0.0.1:27017/doomlagoon'
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    dbConnectionString = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
        process.env.OPENSHIFT_APP_NAME;
}

var db = mongojs(dbConnectionString, ['Accounts', 'Progress']);

// SIGN-IN PROCESS
var IsValidPassword = function (data, Callback) {
    db.Accounts.find({ username: data.username, password: data.password }, function (error, result) {
        if(result.length > 0)
            Callback(true);
        else
            Callback(false);
    });
    
}
var IsUsernameTaken = function (data, Callback) {
    db.Accounts.find({ username: data.username }, function (error, result) {
        if (result.length > 0)
            Callback(true);
        else
            Callback(false);
    });
}
var AddUser = function (data, Callback) {
    db.Accounts.insert({ username: data.username, password: data.password }, function (error) {
        Callback();
    });
}
var RemoveUser = function (data, Callback) {
    db.Accounts.remove({ username: data.username }, function (error, result) {
        Callback();
    });
}
*/

module.exports = {
    InitSocketCalls: function (socket) {
        socket.on("SignIn", function (data) {
            // IsValidPassword(data, function (result) {
            //     if (result) {
            //         socket.emit("SignInResponse", { success: true });
            //     }
            //     else
            //         socket.emit("SignInResponse", { success: false });
            // });
        });

        socket.on("SignUp", function (data) {
            // IsUsernameTaken(data, function (result) {
            //     if (result) {
            //         socket.emit("SignUpResponse", { success: false });
            //     }
            //     else {
            //         AddUser(data, function () {
            //             socket.emit("SignUpResponse", { success: true });
            //         });
            //     }
            // });
        });

        socket.on("RemoveAccount", function (data) {
            // IsValidPassword(data, function (result) {
            //     if (result) {
            //         RemoveUser(data, function () {
            //             socket.emit("RemoveAccountResponse", { success: true });
            //         });
            //     }
            //     else
            //         socket.emit("RemoveAccountResponse", { success: false });
            // });
        });
    }
}