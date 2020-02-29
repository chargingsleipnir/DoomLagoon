// Gameobjects

var NetSprite = function (initPixelPos, image, name, id) {
    var self = game.add.sprite(initPixelPos.x, initPixelPos.y, image);

    self.name = name || 'I am Error';

    // This location and anchor.set is specifically designed to place name centered above player.
    var dispName = game.add.text(self.width / 2, -4, self.name, Constants.DISP_NAME_STYLE);
    dispName.anchor.set(0.5, 1.0);
    self.addChild(dispName);

    self.id = id;
    self.dir = 'r';
    
    // TODO: Eliminate this?
    self.GetUpdatePack = function () {
        return {
            pixelPos: { x: self.position.x, y: self.position.y },
            dir: self.dir
        };
    }
    
    self.ChangeDir = function (dir) {
        self.dir = dir;

        if (dir == 'l') {
            self.loadTexture('navBoatLeft');
        }
        else if (dir == 'r') {
            self.loadTexture('navBoatRight');
        }
        else if (dir == 'u') {
            self.loadTexture('navBoatUp');
        }
        else {
            self.loadTexture('navBoatDown');
        }
    };
    
    self.speed = 4;
    var netSpriteMoving = false;
    var ns_moveDist = { x: 0, y: 0 };
    var ns_moveFracCovered = { x: 0, y: 0 };
    var ns_distToCover = { x: 0, y: 0 };
    var ns_moveCache = {
        startX: initPixelPos.x, startY: initPixelPos.y, startDir: self.dir, 
        endX: initPixelPos.x, endY: initPixelPos.y, endDir: self.dir,
        holdX: initPixelPos.x, holdY: initPixelPos.y, holdDir: self.dir
    };

    self.ServerUpdate = function (serverSprite) {
        netSpriteMoving = false;

        ns_moveCache.startX = ns_moveCache.endX;
        ns_moveCache.startY = ns_moveCache.endY;
        ns_moveCache.startDir = ns_moveCache.endDir;
        
        ns_moveCache.endX = ns_moveCache.holdX;
        ns_moveCache.endY = ns_moveCache.holdY;
        ns_moveCache.endDir = ns_moveCache.holdDir;
        
        ns_moveCache.holdX = serverSprite.pixelPos.x;
        ns_moveCache.holdY = serverSprite.pixelPos.y;
        ns_moveCache.holdDir = serverSprite.dir;

        ns_distToCover.x = Math.abs(ns_moveCache.endX - ns_moveCache.startX);
        ns_distToCover.y = Math.abs(ns_moveCache.endY - ns_moveCache.startY);
        
        ns_moveDist.x = 0;
        ns_moveDist.y = 0;
        ns_moveFracCovered.x = 0;
        ns_moveFracCovered.y = 0;

        netSpriteMoving = true;

        self.ChangeDir(ns_moveCache.endDir);
    }
    
    self.Update = function () {
        
        if (netSpriteMoving) {
            if (ns_distToCover.x > 0) {
                if (ns_moveFracCovered.x < 1.0) {
                    ns_moveDist.x += self.speed;
                    ns_moveFracCovered.x = ns_moveDist.x / ns_distToCover.x;
                    self.position.x = game.math.linearInterpolation([ns_moveCache.startX, ns_moveCache.endX], ns_moveFracCovered.x);
                }
                else {
                    self.position.x = ns_moveCache.endX;
                }
            }
            else {
                self.position.x = ns_moveCache.endX;
            }
            if (ns_distToCover.y > 0) {
                if (ns_moveFracCovered.y < 1.0) {
                    ns_moveDist.y += self.speed;
                    ns_moveFracCovered.y = ns_moveDist.y / ns_distToCover.y;
                    self.position.y = game.math.linearInterpolation([ns_moveCache.startY, ns_moveCache.endY], ns_moveFracCovered.y);
                }
                else {
                    self.position.y = ns_moveCache.endY;
                }
            }
            else {
                self.position.y = ns_moveCache.endY;
            }
        }
        // TODO: Maybe get rid of this whole "isMoving check for the net sprites"
        else {
            self.position.x = ns_moveCache.endX;
            self.position.y = ns_moveCache.endY;
        }
    };
    

    return self;
}

var ClientPlayer = function (initGridPos, image, name, id) {

    var self = new NetSprite({ x: initGridPos.x * Constants.TILE_SIZE, y: initGridPos.y * Constants.TILE_SIZE }, image, name, id);
    
    self.GetInitPack = function () {
        return {
            id: self.id,
            name: self.name,
            gridPos: initGridPos,
            pixelPos: self.position,
            dir: self.dir
        };
    };
    
    var lastMoveRegistered = true;

    self.gridPos = { x: initGridPos.x, y: initGridPos.y };
    var neighbors = { l: 0, r: 0, u: 0, d: 0 };

    var keys = {
        left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        right: game.input.keyboard.addKey(Phaser.Keyboard.D),
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        down: game.input.keyboard.addKey(Phaser.Keyboard.S),

        testLeft: game.input.keyboard.addKey(Phaser.Keyboard.J),
        testRight: game.input.keyboard.addKey(Phaser.Keyboard.L),
        testUp: game.input.keyboard.addKey(Phaser.Keyboard.I),
        testDown: game.input.keyboard.addKey(Phaser.Keyboard.K)
    };

    //////////////////////////////////////////////////////////////////////////// JUST FOR TESTING
    Network.CreateResponse("CellValueRes", function (value) {
        console.log("cell value from server: " + value);
    });

    keys['testLeft'].onDown.add(function () {
        Network.Emit("GetCellValue", { x: self.gridPos.x - 1, y: self.gridPos.y });
        console.log("cell value from client: " + neighbors.l);        
    });
    keys['testRight'].onDown.add(function () {
        Network.Emit("GetCellValue", { x: self.gridPos.x + 1, y: self.gridPos.y });
        console.log("cell value from client: " + neighbors.r);
    });
    keys['testUp'].onDown.add(function () {
        Network.Emit("GetCellValue", { x: self.gridPos.x, y: self.gridPos.y - 1 });
        console.log("cell value from client: " + neighbors.u);
    });
    keys['testDown'].onDown.add(function () {
        Network.Emit("GetCellValue", { x: self.gridPos.x, y: self.gridPos.y + 1 });
        console.log("cell value from client: " + neighbors.d);
    });
    //////////////////////////////////////////////////////////////////////////////////////////
       
    // Basic movement controls/actions
    keys['left'].onHoldCallback = function () {
        if (self.isMoving == false && lastMoveRegistered && neighbors['l'] == 0) {
            Network.Emit("MoveToCell", {
                // TODO: Finally, fully get rid of lastCell, if still not being used
                lastCell: { x: self.gridPos.x, y: self.gridPos.y },
                nextCell: { x: self.gridPos.x - 1, y: self.gridPos.y }, 
                dir: 'l'
            });
            MoveOnGrid(Constants.DIR_LEFT, 'l');
            neighbors['r'] = 0;
        }
    };
    keys['right'].onHoldCallback = function () {
        if (self.isMoving == false && lastMoveRegistered && neighbors['r'] == 0) {
            Network.Emit("MoveToCell", {
                lastCell: { x: self.gridPos.x, y: self.gridPos.y },
                nextCell: { x: self.gridPos.x + 1, y: self.gridPos.y }, 
                dir: 'r'
            });
            MoveOnGrid(Constants.DIR_RIGHT, 'r');
            neighbors['l'] = 0;
        }
    };
    keys['up'].onHoldCallback = function () {
        if (self.isMoving == false && lastMoveRegistered && neighbors['u'] == 0) {
            Network.Emit("MoveToCell", {
                lastCell: { x: self.gridPos.x, y: self.gridPos.y },
                nextCell: { x: self.gridPos.x, y: self.gridPos.y - 1 }, 
                dir: 'u'
            });
            MoveOnGrid(Constants.DIR_UP, 'u');
            neighbors['d'] = 0;
        }
    };
    keys['down'].onHoldCallback = function () {
        if (self.isMoving == false && lastMoveRegistered && neighbors['d'] == 0) {
            Network.Emit("MoveToCell", {
                lastCell: { x: self.gridPos.x, y: self.gridPos.y },
                nextCell: { x: self.gridPos.x, y: self.gridPos.y + 1 }, 
                dir: 'd'
            });
            MoveOnGrid(Constants.DIR_DOWN, 'd');
            neighbors['u'] = 0;
        }
    };

    Network.CreateResponse('UpdateNeighbor', function (neighbor) {
        neighbors[neighbor.side] = neighbor.occupancy;
    });
    // Called by server-self.
    Network.CreateResponse('UpdateNeighbors', function (serverNeighbors) {
        neighbors.l = serverNeighbors.l;
        neighbors.r = serverNeighbors.r;
        neighbors.u = serverNeighbors.u;
        neighbors.d = serverNeighbors.d;
    });
    Network.CreateResponse("ConfirmMove", function (moveData) {
        self.gridPos.x = self.nextCell.x;
        self.gridPos.y = self.nextCell.y;
        lastMoveRegistered = true;
        // TODO: Other confirmations as needed
    });
    Network.CreateResponse("CancelMove", function () {
        self.MoveTo(self.gridPos, self.dir);
        self.isMoving = true;
        lastMoveRegistered = true;
    });
    var MoveOnGrid = function (dirPoint, dirChar) {
        lastMoveRegistered = false;
        self.nextCell.x = self.gridPos.x + dirPoint.x;
        self.nextCell.y = self.gridPos.y + dirPoint.y;
        self.MoveTo(self.nextCell, dirChar);
    }
    
    // Player Sprite Movement
    self.isMoving = false;
    self.nextCell = { x: 0, y: 0 };
    var moveDist = 0.0;
    var moveFracCovered = 0.0;
    var moveCache = { startX: 0, startY: 0, endX: 0, endY: 0 };
    
    self.MoveTo = function (cell, dir) {
        self.ChangeDir(dir);
        
        self.isMoving = true;
        // Set data for move
        moveCache.startX = self.position.x;
        moveCache.startY = self.position.y;
        moveCache.endX = cell.x * Constants.TILE_SIZE;
        moveCache.endY = cell.y * Constants.TILE_SIZE;
    };
    
    self.Update = function () {
        // LERP movement, allowing for a second cell's desitnation to be input just before the end of the first movement.
        if (self.isMoving) {
            
            moveDist += self.speed;
            moveFracCovered = moveDist / Constants.TILE_SIZE;
            
            // Still moving into cell, keep updating position
            if (moveFracCovered < 1.0) {
                self.position.set(
                    game.math.linearInterpolation([moveCache.startX, moveCache.endX], moveFracCovered),
                    game.math.linearInterpolation([moveCache.startY, moveCache.endY], moveFracCovered)
                );
                Network.Emit("UpdateMoveToServer", self.GetUpdatePack());
            }
            else {
                self.isMoving = false;
                self.position.set(moveCache.endX, moveCache.endY);
                Network.Emit("UpdateMoveToServer", self.GetUpdatePack());
                moveDist = 0.0;
                moveFracCovered = 0.0;
            }
        }
    }

    return self;
}

var Ship = function (sprite) {
    var self = {
        tubbList: []
    }

    self.Update = function () {
        // Go through all tubbs and perform individual updates
    }

    return self;
}