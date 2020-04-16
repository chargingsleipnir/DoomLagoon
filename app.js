var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

var dbHdlr = require('./Server/DatabaseHandler.js')();
var objHdlrs = require('./Server/ObjectHandlers.js')(dbHdlr);

// VARIABLES -----

const ip = process.env.IP || '127.0.0.1',
      port = process.env.PORT || 8000;


// ROUTES -----

// This allows client access to everything under these directories.
app.use(express.static(__dirname + '/Client'));
app.use(express.static(__dirname + '/Shared'));
app.use(express.static(__dirname + '/node_modules/phaser/dist/phaser.js'));

var routes = { };

routes['/'] = function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile('./index.html');
};

for (var r in routes) {
  app.get(r, routes[r]);
}

server.listen(port, ip, () => {
  console.log(`Server running at http://${ip}:${port}/`);
});

io.sockets.on("connection", function (socket) {
  console.log(`Socket connection established: ${socket.id} `);
  dbHdlr.InitSocketCalls(socket);
  objHdlrs.InitSocketCalls(io, socket);
});
objHdlrs.PassIoObj(io);

// Update to Clients
var tick = 1000 / 30;
setInterval(function () {
  objHdlrs.Update();
  io.emit("UpdateFromServer", objHdlrs.GetUpdatePack());
}, tick);

//? Is 30 correct? 60? Update locally = needs to match client for enemies to move at the same pace, but I suppose they don't really have to.
// tick = 1000 / 60;
// setInterval(function () {
//   objHdlrs.Update();
// }, tick);