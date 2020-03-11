var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

var dbHdlr = require('./Server/DatabaseHandler.js');
var objHdlrs = require('./Server/ObjectHandlers.js');

// VARIABLES -----

const ip = '127.0.0.1',
      port = 8000;


// CACHE -----

//  Local cache for static content.
var cache = { 'index': fs.readFileSync('./Client/index.html') };
var cache_get = function (key) {
    return cache[key];
};


// TERMINATION -----

var terminator = function(sig) {
  if (typeof sig === "string") {
      console.log('%s: Received %s - terminating sample app ...', Date(Date.now()), sig);
      process.exit(1);
  }
  console.log('%s: Node server stopped.', Date(Date.now()) );
};

//  Process on exit and signals.
process.on('exit', function () {
  terminator();
});

// Removed 'SIGPIPE' from the list - bugz 852598.
['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
  'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
].forEach(function(element, index, array) {
  process.on(element, function () {
      terminator(element);
  });
});

// ROUTES -----

var routes = { };

routes['/asciimo'] = function(req, res) {
    var link = "http://i.imgur.com/kmbjB.png";
    res.send("<html><body><img src='" + link + "'></body></html>");
};

routes['/'] = function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.send(cache_get('index'));
    //replace above two lines with this?? res.sendFile(__dirname + '/index.html');
};

// This allows client access to everything under these directories.
app.use(express.static(__dirname + '/Client'));
app.use(express.static(__dirname + '/Shared'));

app.use(express.static(__dirname + '/node_modules/phaser/dist/phaser.js'));

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

// Update function
var tick = 1000 / 10;
setInterval(function () {
  io.emit("UpdateFromServer", objHdlrs.GetUpdatePack());
}, tick);