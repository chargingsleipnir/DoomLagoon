// TODO const bcrypt = require('bcrypt');

const {Client} = require('pg');
const client = new Client({
    user: "postgres",
    password: "admin",
    host: "localhost",
    port: 5432,
    database: "doomLagoonDB"
});

//* DB TEST -> in terminal, "npm run printFullTable"

async function Connect() {
    try {
        await client.connect();
    }
    catch(e) {
        console.error(`Failed to connect to database: ${e}`);
    }
}
Connect();

module.exports = function() {

    async function CheckLoginCreds(data) {
        try {
            const {rows} = await client.query("SELECT FROM players WHERE username = $1 AND passhash = $2", [data.username, data.password]);
            if(rows.length != 1)
                throw "Either 0 or 2+ matches for username & password."
            
            return true;
        }
        catch(e) {
            console.error(`Exception thrown in CheckLoginCreds: ${e}`);
            return false;
        }
    }

    return {
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

            socket.on("ReqRemoveAccount", async function (data) {
                var success = await CheckLoginCreds(data);
                if (success) {
                    await client.query("DELETE FROM players WHERE username = $1 AND passhash = $2", [data.username, data.password]);
                }
                socket.emit("RecRemoveAccount", success);
            });
        }
    }
}


// POSTGRES DB LEARNING - SETUP COMMANDS ====================================

/*
CREATE TABLE players (
	id serial primary key,
	socketID character varying(100),
	username character varying(25) NOT NULL,
	passHash character varying(100) NOT NULL,
	gridPos jsonb NOT NULL
);

INSERT INTO players (socketID, username, passHash, gridPos) VALUES (
	'abcd1234SocketIDSample',
	'username Sample',
	'xyz890passHashSample',
	'{"x": 3, "y": 2}'
);

INSERT INTO players VALUES (
	DEFAULT,
	'efgh5678SocketIDSample',
	'username Sample 2',
	'lmn567passHashSample2',
	'{"x": 4, "y": 1}'
);
*/