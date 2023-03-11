const bcrypt = require('bcrypt');
var Consts = require('../Shared/Consts.js');
const { Client } = require('pg');

// console.log(`process.env:`, process.env);
let client;
if(process.env.DATABASE_URL) {
    client = new Client(process.env.DATABASE_URL);
}
else {
    client = new Client();
}

//* DB TEST -> in terminal, "npm run printFullTable"

const DbConnect = async () => {
    try {
        console.log("Attempting databse connection...");
        await client.connect();
        console.log(`Database connection success <${client?._connected}>`);
    }
    catch(e) {
        console.error(`Failed to connect to database: ${e}`);
    }
}
DbConnect();

module.exports = function() {

    async function CheckSingleRow(column, data) {
        try {
            if(!client?._connected) throw "Not connected to DB";

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
            if(!client?._connected) throw "Not connected to DB";

            const {rows} = await client.query("SELECT passhash FROM players WHERE username = $1", [data.username]);
            if(rows.length != 1)
               throw "Either 0 or 2+ matches for username & password."
            
            return bcrypt.compareSync(data.password, rows[0]['passhash']);
        }
        catch(e) {
            console.error(`Exception thrown in CheckLoginCreds: ${e}`);
            return false;
        }
    }
    async function DeactivateSlots(socketID) {
        try {
            if(!client?._connected) throw "Not connected to DB";

            await client.query("UPDATE players SET socketID = null WHERE socketid = $1", [socketID]);
        }
        catch(e) {
            console.error(`Exception thrown in DeactivateSlots: ${e}`);
        }
    }

    return {
        InitSocketCalls: socket => {
            socket.on("ReqLoadSlot", async function (data) {
                var success = await CheckLoginCreds(data);
                var orient = null;
                var upgrades = null;
                if (success) {
                    try {
                        if(!client?._connected) throw "Not connected to DB";

                        DeactivateSlots(socket.client.id);
                        await client.query("UPDATE players SET socketID = $1 WHERE username = $2", [socket.client.id, data.username]);
                        const {rows} = await client.query(`SELECT orientation, upgrades FROM players WHERE username = $1`, [data.username]);
                        if(rows.length == 1) {
                            orient = rows[0]["orientation"];
                            upgrades = rows[0]["upgrades"];
                        }
                    }
                    catch(e) {
                        console.error(`Exception thrown in ReqEraseSlot socket call: ${e}`);
                        success = false;
                    }
                }
                socket.emit("RecLoadSlot", {
                    success: success,
                    gridPos: orient ? { x: orient.x, y: orient.y } : orient,
                    upgrades: upgrades
                });
            });

            socket.on("ReqCreateSlot", async function (data) {
                // If username is successfully found, that's a fail - as usernames cannot be duplicated
                var signUpSuccess = !(await CheckSingleRow("username", data.user.name));
                var orient = data.slotData ? data.slotData.orientation : { x: -1, y: -1, dir: -1 };
                var upgrades = data.slotData ? data.slotData.upgrades : { equip: 0, ability: 0 };

                if (signUpSuccess) {
                    try {
                        if(!client?._connected) throw "Not connected to DB";

                        // console.log(`TEST INSERT ROW: name <${data.user.name}>, raw password <${data.user.password}>`);

                        // First, see if this user is already signed into another slot
                        DeactivateSlots(socket.client.id);
                        await client.query("INSERT INTO players VALUES (DEFAULT, $1, $2, $3, $4, $5)", [
                            socket.client.id,
                            data.user.name,
                            bcrypt.hashSync(data.user.password, Consts.SALT_ROUNDS),
                            orient,
                            upgrades
                        ]);
                    }
                    catch(e) {
                        console.error(`Exception thrown in ReqCreateSlot socket call: ${e}`);
                        signUpSuccess = false;
                    }
                }
                socket.emit("RecCreateSlot", {
                    success: signUpSuccess,
                    gridPos: orient,
                    upgrades: upgrades
                });
            });

            socket.on("ReqEraseSlot", async function (data) {
                var success = await CheckLoginCreds(data);
                var activeSlot = false;
                if (success) {
                    try {
                        if(!client?._connected) throw "Not connected to DB";

                        // Check to see whether the slot being erased is even the one that is currently being used.
                        const {rows} = await client.query("SELECT socketid FROM players WHERE username = $1", [data.username]);
                        activeSlot = rows[0]['socketid'] == socket.client.id;

                        await client.query("DELETE FROM players WHERE username = $1", [data.username]);
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

            socket.on("ReqSave", async function (data) {
                var success = true;
                try {
                    if(!client?._connected) throw "Not connected to DB";

                    await client.query("UPDATE players SET orientation = $1, upgrades = $2 WHERE socketID = $3", [data.orientation, data.upgrades, socket.client.id]);
                }
                catch(e) {
                    console.error(`Exception thrown in ReqSave socket call: ${e}`);
                    success = false;
                }
                socket.emit("RecSave", {
                    success: success
                });
            });
        },
        GetPlayerData: async (socketID) => {
            try {
                if(!client?._connected) throw "Not connected to DB";

                const { rows } = await client.query(`SELECT orientation, upgrades FROM players WHERE socketID = $1`, [socketID]);

                if(rows.length == 1)
                    return rows[0];

                return null;
            }
            catch(e) {
                console.error(`Exception thrown in GetPlayerData: ${e}`);
                return null;
            }
        },
        SaveObjects: async (socketID, orientObj, upgradeObj) => {
            var entryFound = await CheckSingleRow("socketID", socketID);
            if(entryFound) {
                try {
                    if(!client?._connected) throw "Not connected to DB";

                    await client.query("UPDATE players SET orientation = $1, upgrades = $2 WHERE socketid = $3", [orientObj, upgradeObj, socketID]);
                }
                catch(e) {
                    console.error(`Exception thrown in SaveObjects: ${e}`);
                }
            }
        },
        SaveAndExit: async (socketID, orientObj, upgradeObj) => {
            var entryFound = await CheckSingleRow("socketID", socketID);
            if(entryFound) {
                try {
                    if(!client?._connected) throw "Not connected to DB";

                    if(orientObj && upgradeObj)
                        await client.query("UPDATE players SET socketID = null, orientation = $1, upgrades = $2 WHERE socketid = $3", [orientObj, upgradeObj, socketID]);
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
    orientation jsonb,
    upgrades jsonb
);

INSERT INTO players (socketID, username, passHash, orientation, upgrades) VALUES (
	'abcd1234SocketIDSample',
	'username Sample',
	'xyz890passHashSample',
    '{"x": 3, "y": 2}',
    '{"equip": 0, "ability": 1}'
);

INSERT INTO players VALUES (
	DEFAULT,
	'efgh5678SocketIDSample',
	'username Sample 2',
	'lmn567passHashSample2',
    '{"x": 4, "y": 1}',
    '{"equip": 1, "ability": 2}'
);
*/