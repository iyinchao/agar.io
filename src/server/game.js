var cfg = require('../../config/config.json');
var util = require("./util");
var logger = require("./logger").logger();
var GameObject = require("./game_object.js").GameObject;
var SceneObject = require("./game_object.js").SceneObject;
var ScenePlayer = require("./game_object.js").ScenePlayer;
var gameRefs = [];
var curGameId = 0;
var minX = 0;
var maxX = cfg.gameWidth;
var minY = 0;
var maxY = cfg.gameHeight;

var OBJECT_TYPE = {
    PLAYER: 1,
    FOOD: 2,
    VIRUS: 3,
    MASS: 4,
};

function GameLog(_gameId, _playerId, msg)
{
    logger.info("game [" + _gameId + "](" + _playerId + "): " + msg);
}

function PlayerGroup(_x, _y, _name, _player)
{
    return {
        id: _player.id,
        center: [_x, _y],
        dir: [0, 0],
        players: [_player],
        color: util.randomInRange(1, 359),
        name: _name,
        scene: {
            leftUp: [0, 0],
            rightDown: [0, 0],
        },
    };
}

function Exit(_gameId, playerId)
{
    var game = gameRefs[_gameId];
    if (!game) return;

    delete game.moveables[playerId];
}

function Game(_id)
{
    return {
        id: _id,
        moveables: {},
        others: {},
        curObjId: 0,
        foodCount: 0,
        virusCount: 0,
    };
}

function CheckBound(obj)
{

    if (obj.x < minX + obj.radius || obj.x > maxX - obj.radius ||
        obj.y < minY + obj.radius || obj.y > maxY - obj.radius)
        return -1;
    return 0;
}

function UpdatePlayerGroupCenter(pg)
{
    var X = 0, Y = 0, W = 0;
    if (!pg.players || !pg.players.length)
        return;

    for (var id in pg.players) {
        var player = pg.players[id];
        X += player.x * player.weight;
        Y += player.y * player.weight;
        W += player.weight;
    }
    if (W == 0) return;
    pg.center = [parseInt(X / W), parseInt(Y / W)];
}

function GenerateGameObject(type)
{
    var obj = new GameObject();
    obj.type = type;
    switch (type) {
    case OBJECT_TYPE.PLAYER:
        obj.weight = cfg.playerWeight;
        obj.radius = parseInt(util.WeightToRadius(obj.weight));
        obj.speed = 0;
        break;
    case OBJECT_TYPE.VIRUS:
        obj.weight = cfg.virusWeight;
        obj.radius = cfg.virusRadius;
        break;
    case OBJECT_TYPE.MASS:
        obj.weight = cfg.massWeight;
        obj.radius = cfg.massRadius;
        break;
    default:
        obj.type = OBJECT_TYPE.FOOD;
        obj.weight = cfg.foodWeight;
        obj.radius = cfg.foodRadius;
        break;
    }
    // TODO: position dont collide with others
    var pos = util.randomPosition(obj.radius);
    obj.x = parseInt(pos.x + minX);
    obj.y = parseInt(pos.y + minY);

    return obj;
}

function FillEatable(game)
{
    while (game.foodCount < cfg.maxFood) {
        var food = GenerateGameObject(OBJECT_TYPE.FOOD);
        food.id = game.curObjId++;
        game.others[food.id] = food;
        game.foodCount++;
    }

    while (game.virusCount < cfg.maxVirus) {
        var virus = GenerateGameObject(OBJECT_TYPE.VIRUS);
        virus.id = game.curObjId++;
        game.others[virus.id] = virus;
        game.virusCount++;
    }
}

/**
* @brief FindGetIdleGameObject Find a game object whose players' count
* less than maximum; if none is founded, create a new one
*
    * @param 
*
    * @return gameObj reference 
*/
function FindGetIdleGameObject()
{
    for (var i = 0; i < gameRefs.length; ++i) {
        if (Object.keys(gameRefs[i].moveables).length < cfg.maxPlayer) {
            return gameRefs[i];
        }
    }
    var game = new Game(curGameId);
    gameRefs[curGameId++] = game;
    return game;
}

function Join(nickName)
{
    var game = FindGetIdleGameObject();
    var player = GenerateGameObject(OBJECT_TYPE.PLAYER);

    player.id = game.curObjId++;
    game.moveables[player.id] = new PlayerGroup(player.x, player.y, nickName, player);

    return {
        gameId: game.id,
        playerMainId: player.id,
    };
}

// Draw a straight line from (x,y) with direction (dirX,dirY)
// Return the intersect point with bound of scene
function DirCrossPoint(x, y, dirX, dirY)
{
    if (dirX == 0) {
        return dirY > 0 ? [x, maxY] : [x, minY];
    } else if (dirY == 0) {
        return dirX > 0 ? [maxX, y] : [minX, y];
    }
    var tv = dirY / dirX;
    var h = y - tv * x;
    var x1, y1;
    if (dirX > 0 && dirY > 0) {
        x1 = (maxY - h) / tv;
        y1 = tv * maxX + h;
        return x1 < maxX ? [x1, maxY] : [maxX, y1];
    } else if (dirX > 0 && dirY < 0) {
        x1 = (minY - h) / tv;
        y1 = tv * maxX + h;
        return x1 < maxX ? [x1, minY] : [maxX, y1];
    } else if (dirX < 0 && dirY < 0) {
        x1 = (minY - h) / tv;
        y1 = tv * minX + h;
        return x1 > minX ? [x1, minY]: [minX, y1];
    } else {
        x1 = (maxY - h) / tv;
        y1 = tv * minX + h;
        return x1 > minX ? [x1, maxY] : [minX, y1];
    }
}

function DoMove(player, cx, cy)
{
    var dx = cx - player.x, dy = cy - player.y;

    if (dx == 0) {
        if (dy == 0) return;
        dy = dy > 0 ? 1 : -1;
    }

    var tv = util.CosSinX(dx, dy);
    player.x += tv[0] * player.speed * cfg.movePeriod;
    player.y += tv[1] * player.speed * cfg.movePeriod;
    player.x = parseInt(util.MinMax(minX + player.radius, maxX - player.radius, player.x));
    player.y = parseInt(util.MinMax(minY + player.radius, maxY - player.radius, player.y));
}

function Move(_gameId, _playerId, dirX, dirY)
{
    var game = gameRefs[_gameId];
    if (!game) {
        return;
    }
    dirX = parseInt(dirX * 5000);
    dirY = cfg.gameHeight - parseInt(dirY * 5000);
    
    var pg = game.moveables[_playerId];
    if (!pg) return;

    pg.dir = [dirX, dirY];
    if (!dirX && !dirY) {
    }
    for (var id in pg.players) {
        var player = pg.players[id];
        if ((dirX || dirY) && player.speed == 0) {
            player.speed = parseInt(cfg.weightXspeed / player.weight);
            player.speed = player.speed == 0 ? cfg.minSpeed : player.speed;
        } else {
            player.speed = 0;
        }
    }
}

function UpdateSceneBound(_gameId, _playerId, leftTop, rightDown)
{
    var game = gameRefs[_gameId];
    if (!game) return;

    var pg = game.moveables[_playerId];
    if (!pg) return;
    pg.scene.leftUp = leftTop;
    pg.scene.rightDown = rightDown;
    return;
}

function UpdateAttr(player)
{
    player.speed = parseInt(cfg.weightXspeed / player.weight);
    player.radius = parseInt(util.WeightToRadius(player.weight));
}

var virusSplitDir = [
    [0.5, 0.866],
    [1, 0],
    [0.5, -0.866],
    [-0.5, -0.866],
    [-1, 0],
    [-0.5, 0.866],
];
function DoMultiSplit(player)
{
    // split into 6 parts
    var d = player.radius * cfg.splitDistanceToRadius;
    var pw = parseInt(player.weight / virusSplitDir.length);
    var ret = [];
    for (var i = 0; i < virusSplitDir.length; ++i) {
        var newOne = new GameObject(player.id, OBJECT_TYPE.PLAYER, pw);
        UpdateAttr(newOne);
        newOne.x = parseInt(d * virusSplitDir[i][0] + player.x);
        newOne.y = parseInt(d * virusSplitDir[i][1] + player.y);
        if (CheckBound(newOne)) continue;
        ret.push(newOne);
    }
    player.weight = parseInt(player.weight / virusSplitDir.length);
    UpdateAttr(player);
    return ret;
}

function DoBinSplit(player, cosx, sinx)
{
    if (player.radius / 1.414 < cfg.minPlayerRadius) {
        GameLog("-", "*", "Split radius too small");
        return null;
    }

    var copy = new GameObject(player.id, OBJECT_TYPE.PLAYER, player.weight / 2);
    UpdateAttr(copy);

    player.weight -= copy.weight;
    player.speed = copy.speed;
    player.radius = copy.radius;

    var splitDistance = copy.radius * cfg.splitDistanceToRadius;
    copy.x = parseInt(splitDistance * cosx + player.x);
    copy.y = parseInt(splitDistance * sinx + player.y);
    if (CheckBound(copy))
        return null;
    return copy;
}

function Split(_gameId, _playerId)
{
    var game = gameRefs[_gameId];
    if (!game) return;

    var pg = game.moveables[_playerId];
    if (!pg) return;

    var players = pg.players;
    if (players.length * 2 > cfg.maxCellCount) {
        GameLog(_gameId, _playerId, "Exceed max cells count");
        return;
    }
    var tv = util.CosSinX(pg.dir[0], pg.dir[1]);
    if (!tv[0] && !tv[1]) {
        tv[0] = 1;
        tv[1] = 0;
    }
    var length = players.length;
    for (var i = 0; i < length; ++i) {
        var copy = DoBinSplit(players[i], tv[0], tv[1]);
        if (copy) {
            players.push(copy);
        }
    }
    UpdatePlayerGroupCenter(pg);
}

function UpdatePosition(pg)
{
    var point = DirCrossPoint(pg.center[0], pg.center[1], pg.dir[0], pg.dir[1]);
    for (var id in pg.players) {
        var player = pg.players[id];
        DoMove(player, point[0], point[1]);
    }
}

function CollideWithObject(player, obj)
{
    var dis = util.Distance(player, obj);
    if (dis < player.radius && player.radius > obj.radius * cfg.sizeToEat) {
        player.weight += obj.weight;
        obj.weight = 0;
        UpdateAttr(player);
        if (obj.type == OBJECT_TYPE.VIRUS) {
            return DoMultiSplit(player);
        }
    }
    return [];
}

function CollidePlayerGroup(player, start, playerGroup)
{
    for (var i = start; i < playerGroup.players.length; ++i) {
        CollideWithObject(player, playerGroup.players[i]);
    }
}

function CollideOtherPlayers(player, pgid, game)
{
    for (var gid in game.moveables) {
        if (pgid == gid) {
            // self
            continue;
        }
        CollidePlayerGroup(player, 0, game.moveables[gid]);
    }
}

function DetectCollision(game)
{
    var playerDead = [];
    for (var gid in game.moveables) {
        var cell = [];
        var pg = game.moveables[gid];
        for (var i = 0; i < pg.players.length; ++i) {
            // collide with self
            if (pg.players[i].weight == 0) continue;
            CollidePlayerGroup(pg.players[i], i + 1, pg);

            // collide with other players
            CollideOtherPlayers(pg.players[i], gid, game);
            
            // collide with food, virus and mass
            for (var objID in game.others) {
                var obj = game.others[objID];
                var ret = CollideWithObject(pg.players[i], obj);
                if (ret.length > 0) {
                    cell.concat(ret);
                }
                if (obj.weight == 0) {
                    delete game.others[obj.id];
                }
            }
            cell.push(pg.players[i]);
        }

        if (cell.length == 0) {
            playerDead.push(gid);
        } else {
            pg.players = cell;
        }
    }
    return playerDead;
}

function __CheckInBound(x, y, leftTop, rightDown)
{
    return (x > leftTop[0] && x < rightDown[0] && y < leftTop[1] && y > rightDown[1]);
}

function ExtractPlayerScene(game, leftTop, rightDown)
{
    var scene = [];
    for (var gid in game.moveables) {
        var pg = game.moveables[gid];
        if (pg.players.length == 0) continue;
        var scenePlayer = new ScenePlayer(OBJECT_TYPE.PLAYER, pg);
        for (var i = 0; i < pg.players.length; ++i) {
            var p = pg.players[i];
            if (__CheckInBound(p.x, p.y, leftTop, rightDown)) {
                scenePlayer.cells.push({
                    id: i,
                    x: p.x,
                    y: p.y,
                    r: p.radius,
                });
            }
        }
        if (scenePlayer.cells.length > 0) {
            scene.push(scenePlayer);
        }
    }
    for (var objId in game.others) {
        var obj = game.others[objId];
        if (__CheckInBound(obj.x, obj.y, leftTop, rightDown)) {
            scene.push(new SceneObject(obj));
        }
    }
    return scene;
}

function Update(_gameId)
{
    var game = gameRefs[_gameId];
    if (!game) {
        GameLog(_gameId, "*", "Game not found");
        return;
    }

    for (var gid in game.moveables) {
        UpdatePosition(game.moveables[gid]);
    }

    var dead = DetectCollision(game);
    for (var i = 0; i < dead.length; ++i) {
        delete game.moveables[dead[i]];
    }
    var pkg = {
        "scenes": {},
        "dead": dead,
    };
    for (gid in game.moveables) {
        var scene = game.moveables[gid].scene;
        UpdatePlayerGroupCenter(game.moveables[gid]);
        pkg.scenes[gid] = ExtractPlayerScene(game, scene.leftUp, scene.rightDown);
    }
    FillEatable(game);
    return pkg;
}

function DoEject(player, cosx, sinx)
{
    if (player.weight < cfg.massWeight) {
        GameLog("-", "*", "Eject weight too small");
        return null;
    }

    var mass = new GameObject(0, OBJECT_TYPE.MASS, cfg.massWeight, cfg.massRadius);
    player.weight -= cfg.massWeight;
    UpdateAttr(player);

    var ejectDis = player.radius * cfg.ejectDistanceToRadius;
    mass.x = parseInt(ejectDis * cosx + player.x);
    mass.y = parseInt(ejectDis * sinx + player.y);
    
    if (CheckBound(mass))
        return null;
    return mass;
}

function Eject(_gameId, _playerId)
{
    var game = gameRefs[_gameId];
    if (!game) return;

    var pg = game.moveables[_playerId];
    if (!pg) return;

    var players = pg.players;
    var tv = util.CosSinX(pg.dir[0], pg.dir[1]);
    if (!tv[0] && !tv[1]) {
        tv[0] = 1;
        tv[1] = 0;
    }
    for (var i = 0; i < players.length; ++i) {
        var mass = DoEject(players[i], tv[0], tv[1]) ;
        if (mass) {
            mass.id = game.curObjId;
            game.others[game.curObjId++] = mass;
        }
    }
    UpdatePlayerGroupCenter(pg);
}

exports.Join = Join;
exports.Move = Move;
exports.UpdateSceneBound = UpdateSceneBound;
exports.Split = Split;
exports.Update = Update;
exports.Exit = Exit;
exports.Eject = Eject;

function TestFoo()
{
    var ret = Join();
    var game = gameRefs[0];
    cfg.maxFood = 0;
    cfg.maxVirus= 0;
    FillEatable(game);
    UpdateSceneBound(0, 0, [minX, maxY], [maxX, minY]);
    Move(0, 0, 100, 0);

    var player = game.moveables[0].players[0];
    Join();
    Move(0,1,0,0);
    console.log(game);
    var p2 = game.moveables[1].players[0];
    p2.radius /=2;
    p2.x = player.x + 40;
    p2.y=player.y;
    console.log(p2.x+":"+p2.y);
    for(var i=0;i<10;i++){
        ret=Update(0);
        console.log(player.x+":"+player.y+":"+player.radius+"="+player.weight);
        console.log(ret.dead);
    }
}

TestFoo();
