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
    async function DeactivateSlots(socketID) {
        try {
            await client.query("UPDATE players SET socketID = null WHERE socketid = $1", [socketID]);
        }
        catch(e) {
            console.error(`Exception thrown in DeactivateSlots: ${e}`);
        }
    }

    return {
        InitSocketCalls: socket => {

            // TODO: If they do this during gameplay, the player needs to be updated to match database information
            // Reset whole game?
            socket.on("ReqLoadSlot", async function (data) {
                var success = await CheckLoginCreds(data);
                var orient = null;
                if (success) {
                    try {
                        DeactivateSlots(socket.client.id);
                        await client.query("UPDATE players SET socketID = $1 WHERE username = $2", [socket.client.id, data.username]);
                        const {rows} = await client.query(`SELECT orientation FROM players WHERE username = $1`, [data.username]);
                        if(rows.length == 1)
                            orient = rows[0]["orientation"];
                    }
                    catch(e) {
                        console.error(`Exception thrown in ReqEraseSlot socket call: ${e}`);
                        success = false;
                    }
                }
                socket.emit("RecLoadSlot", {
                    success: success,
                    gridPos: orient ? { x: orient.x, y: orient.y } : orient
                });
            });

            socket.on("ReqCreateSlot", async function (data) {
                // If username is successfully found, that's a fail - as usernames cannot be duplicated
                var signUpSuccess = !(await CheckSingleRow("username", data.username));

                if (signUpSuccess) {
                    try {
                        // First, see if this user is already signed into another slot
                        DeactivateSlots(socket.client.id);
                        await client.query("INSERT INTO players VALUES (DEFAULT, $1, $2, $3, $4)", [
                            socket.client.id,
                            data.username,
                            data.password,
                            null
                        ]);
                    }
                    catch(e) {
                        console.error(`Exception thrown in ReqCreateSlot socket call: ${e}`);
                        signUpSuccess = false;
                    }
                }
                socket.emit("RecCreateSlot", signUpSuccess);
            });

            socket.on("ReqEraseSlot", async function (data) {
                var success = await CheckLoginCreds(data);
                var activeSlot = false;
                if (success) {
                    try {
                        // Check to see whether the slot being erased is even the one that is currently being used.
                        const {rows} = await client.query("SELECT socketid FROM players WHERE username = $1 AND passhash = $2", [data.username, data.password]);
                        activeSlot = rows[0]['socketid'] == socket.client.id;

                        await client.query("DELETE FROM players WHERE username = $1 AND passhash = $2", [data.username, data.password]);
                    }
                    catch(e) {
                        console.error(`Exception thrown in ReqEraseSlot socket call: ${e}`);
                        success = false;
                    }
                }
                socket.emit("RecEraseSlot", {
                    success: success,
                    activeSlot: activeSlot
                });
            });
        },
        GetPlayerData: async (socketID) => {
            try {
                const {rows} = await client.query(`SELECT orientation FROM players WHERE socketID = $1`, [socketID]);
                if(rows.length == 1)
                    return rows[0];

                return null;
            }
            catch(e) {
                console.error(`Exception thrown in GetPlayerData: ${e}`);
                return null;
            }
        },
        SaveOrientation: async (socketID, orientObj) => {
            var entryFound = await CheckSingleRow("socketID", socketID);
            if(entryFound) {
                try {
                    await client.query("UPDATE players SET orientation = $1", [orientObj]);
                }
                catch(e) {
                    console.error(`Exception thrown in SaveOrientation: ${e}`);
                }
            }
        },
        SaveAndExit: async (socketID, orientObj) => {
            var entryFound = await CheckSingleRow("socketID", socketID);
            if(entryFound) {
                try {
                    if(orientObj)
                        await client.query("UPDATE players SET socketID = null, orientation = $1 WHERE socketid = $2", [orientObj, socketID]);
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