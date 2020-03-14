// [Shorthand] {Client} is a property of the object being returned, only accessible like this because I'm using it's exact name. Thus, the base/parent object is hidden this way.
// const Client = require('pg').Client; --> same thing as below
const {Client} = require('pg');
const client = new Client({
    user: "postgres",
    password: "admin",
    host: "localhost",
    port: 5432,
    database: "doomLagoonDB"
});



// Promise method
client.connect()
.then(() => console.log("Connected to Postgres database successfully."))
.then(() => client.query("select * from players")) // This returns the "results" object send down the chain & used later.
//.then(() => client.query("select * from players where socketid = 'abcd1234SocketIDSample'"))
//.then(() => client.query("select * from players where socketid = $1", ["abcd1234SocketIDSample"]))
.then(results => console.table(results.rows))
.catch(e => console.log("Exception caught:", e))
.finally(() => client.end());



// Async method
// You have to add try/catchs to this, whereas that's built into promise system above.
// However, this is easier to debug/step-through, and might be the only way to break apart database calls between connecting and disconnecting,
// unless I want to connect & disconnect every time?
// async function Execute() {
//     try {
//         await client.connect();
//         console.log("Connected to Postgres database successfully.");
//         const {rows} = await client.query("select * from players");
//         console.table(rows);
//     }
//     catch(e) {
//         console.log("Exception caught:", e)
//     }
//     finally {
//         await client.end();
//         console.log("Connection terminated successfully.");
//     }
// }
// Execute();



// Transaction method
// Try/catches needed here as well
// Big advantage in being able to rollback on errors
// async function Execute() {
//     try {
//         await client.connect();
//         await client.query("BEGIN");
//         await client.query("update players set username = $1", ["My name is Error"]);
        
//         // Everything above will print as we want, but error below will stop the commit from hapenning, so the actual DB doesn't change.
//         const {rows} = await client.query("select * from players");
//         console.table(rows);

//         // Error, id taken
//         await client.query("insert into players values ($1, $2, $3, $4, $5)", [
//             1,
//             null,
//             'username',
//             'passHash',
//             '{"x": 1, "y": 1}'
//         ]);
//         await client.query("COMMIT");
//     }
//     catch(e) {
//         console.log(`Exception caught: ${e}`);
//         await client.query("ROLLBACK");
//     }
//     finally {
//         await client.end();
//         console.log("Connection terminated successfully.");
//     }
// }
// Execute();