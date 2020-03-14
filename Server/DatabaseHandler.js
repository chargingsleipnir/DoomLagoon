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

    async function CheckSingleRow(column, data) {
        try {
            const {rows} = await client.query(`SELECT FROM players WHERE ${column} = $1`, [data]);
            if(rows.length == 1)
                return true;
        }
        catch(e) {
            console.error(`Exception thrown in CheckUsername: ${e}`);
        }
        return false;
    }
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
        InitSocketCalls: socket => {

            // TODO: If they do this during gameplay, the player needs to be updated to match database information
            // Reset whole game?
            socket.on("ReqSignIn", async function (data) {
                var success = await CheckLoginCreds(data);
                if (success) {
                    try {
                        await client.query("UPDATE players SET socketID = $1 WHERE username = $2", [socket.client.id, data.username]);
                    }
                    catch(e) {
                        console.error(`Exception thrown in ReqRemoveAccount socket call: ${e}`);
                        success = false;
                    }
                }
                socket.emit("RecSignIn", success);
            });

            socket.on("ReqSignUp", async function (data) {
                // If username is successfully found, that's a fail - as usernames cannot be duplicated
                var signUpSuccess = !(await CheckSingleRow("username", data.username));

                if (signUpSuccess) {
                    try {
                        await client.query("INSERT INTO players VALUES (DEFAULT, $1, $2, $3, $4)", [
                            socket.client.id,
                            data.username,
                            data.password,
                            {"x": -1, "y": -1}
                        ]);
                    }
                    catch(e) {
                        console.error(`Exception thrown in ReqSignUp socket call: ${e}`);
                        signUpSuccess = false;
                    }
                }
                socket.emit("RecSignUp", signUpSuccess);
            });

            socket.on("ReqRemoveAccount", async function (data) {
                var success = await CheckLoginCreds(data);
                if (success) {
                    try {
                        await client.query("DELETE FROM players WHERE username = $1 AND passhash = $2", [data.username, data.password]);
                    }
                    catch(e) {
                        console.error(`Exception thrown in ReqRemoveAccount socket call: ${e}`);
                        success = false;
                    }
                }
                socket.emit("RecRemoveAccount", success);
            });
        },
        GetPlayerData: async (socketID) => {
            try {
                const {rows} = await client.query(`SELECT FROM players WHERE socketID = $1`, [socketID]);
                if(rows.length == 1)
                    return rows[0];

                return null;
            }
            catch(e) {
                console.error(`Exception thrown in GetPlayerData: ${e}`);
                return null;
            }
        },
        // TODO: Save direction - low priority
        SavePosition: async (socketID, gridpos) => {
            var entryFound = await CheckSingleRow("socketID", socketID);
            if(entryFound) {
                try {
                    await client.query("UPDATE players SET gridpos = $1", [gridpos]);
                }
                catch(e) {
                    console.error(`Exception thrown in SavePosition: ${e}`);
                }
            }
        },
        SaveAndExit: async (socketID, gridpos) => {
            var entryFound = await CheckSingleRow("socketID", socketID);
            if(entryFound) {
                try {
                    if(gridpos)
                        await client.query("UPDATE players SET socketID = null, gridpos = $1 WHERE socketid = $2", [gridpos, socketID]);
                    else
                        await client.query("UPDATE players SET socketID = null WHERE socketid = $1", [socketID]);
                }
                catch(e) {
                    console.error(`Exception thrown in SaveAndExit: ${e}`);
                }
            }
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