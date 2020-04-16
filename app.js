var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
//var fs = require('fs');

var dbHdlr = require('./Server/DatabaseHandler.js')();
var objHdlrs = require('./Server/ObjectHandlers.js')(dbHdlr);

// VARIABLES -----
//'127.0.0.1'
const ip = process.env.IP || '0.0.0.0',
      port = process.env.PORT || 8000;


// ROUTES -----
app.use(express.static(__dirname + '/Client'));
app.use(express.static(__dirname + '/Shared'));
app.use(express.static(__dirname + '/node_modules/phaser/dist/phaser.js'));
app.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile('./index.html');
});

// SOCKET CONNECTION -----
io.sockets.on("connection", function (socket) {
  console.log(`Socket connection established: ${socket.id} `);
  dbHdlr.InitSocketCalls(socket);
  objHdlrs.InitSocketCalls(io, socket);
});
objHdlrs.PassIoObj(io);

// SERVER CONNECTION -----
http.listen(port, ip, () => {
  console.log(`${Date(Date.now())}: Server running at http://${ip}:${port}/`);
  // Update to Clients
  var tick = 1000 / 30;
  setInterval(function () {
    objHdlrs.Update();
    io.emit("UpdateFromServer", objHdlrs.GetUpdatePack());
  }, tick);
});