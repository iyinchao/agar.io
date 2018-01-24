var cfg = require('../../config/config.json');
var util = require("./util");
var logger = require("./logger").logger();
var GameObject = require("./game_object.js").GameObject;
var NewSceneObject = require("./game_object.js").NewSceneObject;
var DeleteSceneObject = require("./game_object.js").DeleteSceneObject;
var DeleteScenePlayer = require("./game_object.js").DeleteScenePlayer;
var ScenePlayer = require("./game_object.js").ScenePlayer;
var SceneCell = require("./game_object.js").SceneCell;
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
        kill: 0,
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

    var pg = game.moveables[playerId];
    if (!pg) return;

    var ret = {
        weight: 0,  
        kill: pg.kill,
    };
    for (var i = 0; i < pg.players.length; ++i) {
        ret.weight += pg.players[i].weight;
    }
    delete game.moveables[playerId];
    return ret;
}

function Game(_id)
{
    return {
        id: _id,
        moveables: {},
        others: {},
        changeObj: [],
        changePlayer: {},
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
    pg.center = [X / W, Y / W];
}

function GenerateGameObject(type)
{
    var obj = new GameObject();
    obj.type = type;
    switch (type) {
    case OBJECT_TYPE.PLAYER:
        obj.weight = cfg.playerWeight;
        obj.radius = util.WeightToRadius(obj.weight);
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
    obj.x = pos.x + minX;
    obj.y = pos.y + minY;

    return obj;
}

function FillEatable(game)
{
    while (game.foodCount < cfg.maxFood) {
        var food = GenerateGameObject(OBJECT_TYPE.FOOD);
        food.id = game.curObjId++;
        game.others[food.id] = food;
        game.foodCount++;
        game.changeObj.push(new NewSceneObject(food));
    }

    while (game.virusCount < cfg.maxVirus) {
        var virus = GenerateGameObject(OBJECT_TYPE.VIRUS);
        var R = cfg.virusRadius;
        virus.x = util.randomInRange(5 * R, cfg.gameWidth - 5 * R);
        virus.y = util.randomInRange(5 * R, cfg.gameHeight - 5 * R);
        virus.id = game.curObjId++;
        game.others[virus.id] = virus;
        game.virusCount++;
        var nso = new NewSceneObject(virus);
        delete nso.hue;
        game.changeObj.push(nso);
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
    var setupObj = ExtractPlayerScene(game);
    return {
        gameId: game.id,
        playerMainId: player.id,
        setup: setupObj,
    };
}

// Draw a straight line from (x,y) with direction (dirX,dirY)
// Return the intersect point with bound of scene
function DirCrossPoint(x, y, dirX, dirY)
{
    if (dirX == 0) {
        return dirY >= 0 ? [x, maxY] : [x, minY];
    } else if (dirY == 0) {
        return dirX >= 0 ? [maxX, y] : [minX, y];
    }
    var tv = dirY / dirX;
    var h = y - tv * x;
    var x1, y1;
    if (dirX >= 0 && dirY >= 0) {
        x1 = (maxY - h) / tv;
        y1 = tv * maxX + h;
        return x1 < maxX ? [x1, maxY] : [maxX, y1];
    } else if (dirX >= 0 && dirY <= 0) {
        x1 = (minY - h) / tv;
        y1 = tv * maxX + h;
        return x1 < maxX ? [x1, minY] : [maxX, y1];
    } else if (dirX <= 0 && dirY < 0) {
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
        if (dy == 0) {
            console.log("BUG");
            return -1;
        }
        dy = dy > 0 ? 1 : -1;
    }

    var tv = util.CosSinX(dx, dy);
    player.x += tv[0] * player.speed * cfg.movePeriod;
    player.y += tv[1] * player.speed * cfg.movePeriod;
    player.x = util.MinMax(minX + player.radius, maxX - player.radius, player.x);
    player.y = util.MinMax(minY + player.radius, maxY - player.radius, player.y);
    return 0;
}

function Move(_gameId, _playerId, dirX, dirY)
{
    var game = gameRefs[_gameId];
    if (!game) {
        return;
    }

    dirX = (dirX * 5000);
    dirY = (dirY * 5000);
    
    var pg = game.moveables[_playerId];
    if (!pg) return;

    if (!dirX && !dirY) {
        return;
    }

    pg.dir = [dirX, dirY];
    for (var id in pg.players) {
        var player = pg.players[id];
        UpdateAttr(player);
    }
}

function UpdateAttr(player)
{
    player.speed = cfg.weightXspeed - 0.02 * player.weight;
    player.speed = player.speed < cfg.minPlayerSpeed ? cfg.minPlayerSpeed : player.speed;
    player.radius = (util.WeightToRadius(player.weight));
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
    var pw = (player.weight / virusSplitDir.length);
    var ret = [];
    for (var i = 0; i < virusSplitDir.length; ++i) {
        var newOne = new GameObject(player.id, OBJECT_TYPE.PLAYER, pw);
        UpdateAttr(newOne);
        newOne.x = (d * virusSplitDir[i][0] + player.x);
        newOne.y = (d * virusSplitDir[i][1] + player.y);
        if (CheckBound(newOne)) {
            player.weight += pw;
            continue;
        }
        ret.push(newOne);
    }
    player.weight = (player.weight / virusSplitDir.length);
    UpdateAttr(player);
    return ret;
}

function DoBinSplit(player, cosx, sinx)
{
    if (player.radius / 1.414 < cfg.playerMinRadius) {
        GameLog("-", "*", "Split radius too small");
        return null;
    }

    var copy = new GameObject(player.id, OBJECT_TYPE.PLAYER, player.weight / 2);
    UpdateAttr(copy);

    player.weight -= copy.weight;
    player.speed = copy.speed;
    player.radius = copy.radius;

    var splitDistance = copy.radius * cfg.splitDistanceToRadius;
    copy.x = (splitDistance * cosx + player.x);
    copy.y = (splitDistance * sinx + player.y);
    if (CheckBound(copy)) {
        player.weight += copy.weight;
        return null;
    }
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
        var iret = DoMove(player, point[0], point[1]);
    }
}

var beEat = 0;

function CollideWithObject(player, obj, game, nrPlayers)
{
    var dis = util.Distance(player, obj);
    if (dis < player.radius && player.radius > obj.radius * cfg.sizeToEat) {
        player.weight += obj.weight;
        obj.weight = 0;
        UpdateAttr(player);
        if (game) {
            game.changeObj.push(new DeleteSceneObject(obj));
        }
        if (obj.type == OBJECT_TYPE.VIRUS) {
            game.virusCount--;
            if (nrPlayers < cfg.maxCellCount)
                return DoMultiSplit(player);
        } else if (obj.type == OBJECT_TYPE.FOOD) {
            game.foodCount--;
            beEat++;
        }
    }
    return [];
}

function CollidePlayerGroup(player, start, playerGroup)
{
    var eat = 0;
    for (var i = 0; i < playerGroup.players.length; ++i) {
        var prev = playerGroup.players[i].weight;
        CollideWithObject(player, playerGroup.players[i]);
        if (prev != playerGroup.players[i].weight) {
            eat++;
        }
    }
    return eat;
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
            pg.kill += CollideOtherPlayers(pg.players[i], gid, game);
            
            // collide with food, virus and mass
            for (var objID in game.others) {
                var obj = game.others[objID];
                var ret = CollideWithObject(pg.players[i], obj, game,
                    cell.length + pg.players.length - i);
                if (ret.length > 0) {
                    cell = cell.concat(ret);
                }
                if (obj.weight == 0) {
                    delete game.others[obj.id];
                }
            }
            cell.push(pg.players[i]);
            UpdateAttr(pg.players[i]);
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

function ExtractPlayerScenePlayers(game)
{
    var objs = [];
    for (var gid in game.moveables) {
        var pg = game.moveables[gid];
        if (pg.players.length == 0) {
            delete game.moveables[gid];
            continue;
        }
        var scenePlayer = null;
        if (game.changePlayer[gid]) {
            scenePlayer = new ScenePlayer(OBJECT_TYPE.PLAYER, pg, 0);
        } else {
            scenePlayer = new ScenePlayer(OBJECT_TYPE.PLAYER, pg, 1);
        }
        for (var i = 0; i < pg.players.length; ++i) {
            scenePlayer.cells.push(new SceneCell(pg.players[i], i));
            scenePlayer.weight += pg.players[i].weight;
        }
        objs.push(scenePlayer);
    }

    for (var index in game.changePlayer) {
        if (!game.moveables[index]) {
            objs.push(new DeleteScenePlayer(OBJECT_TYPE.PLAYER, parseInt(index)));
        }
    }
    game.changePlayer = {};
    for (gid in game.moveables) {
        game.changePlayer[gid] = game.moveables[gid].players.length;
    }
    return objs;
}

function ExtractPlayerScene(game)
{
    var objs = [];
    for (var gid in game.moveables) {
        var pg = game.moveables[gid];
        if (pg.players.length == 0) continue;
        var scenePlayer = new ScenePlayer(OBJECT_TYPE.PLAYER, pg, 1);
        for (var i = 0; i < pg.players.length; ++i) {
            scenePlayer.cells.push(new SceneCell(pg.players[i], i, 1));
            scenePlayer.weight += pg.players[i].weight;
        }
        objs.push(scenePlayer);
    }
    for (var id in game.others) {
        var obj = game.others[id];
        var nso = NewSceneObject(obj);
        if (obj.type == OBJECT_TYPE.VIRUS)
            delete nso.hue;
        objs.push(nso);
    }
    return objs;
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
    for (gid in game.moveables) {
        UpdatePlayerGroupCenter(game.moveables[gid]);
    }
    var allPlayers = ExtractPlayerScenePlayers(game);
    game.changeObj = game.changeObj.concat(allPlayers);
    FillEatable(game);
    var allObjs = game.changeObj;
    game.changeObj = [];

    return allObjs;
}

function DoEject(player, cosx, sinx)
{
    if (player.weight < cfg.massWeight ||
        player.weight < cfg.playerWeight) {
        GameLog("-", "*", "Eject weight too small");
        return null;
    }

    var mass = GenerateGameObject(OBJECT_TYPE.MASS);
    mass.id = 0;
    player.weight -= mass.weight;
    UpdateAttr(player);

    var ejectDis = player.radius * cfg.ejectDistanceToRadius;
    mass.x = (ejectDis * cosx + player.x);
    mass.y = (ejectDis * sinx + player.y);
    
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
            game.changeObj.push(new NewSceneObject(mass));
        }
    }
    UpdatePlayerGroupCenter(pg);
}

exports.Join = Join;
exports.Move = Move;
exports.Split = Split;
exports.Update = Update;
exports.Exit = Exit;
exports.Eject = Eject;

function TestFoo()
{
    var ret = Join('pp');
    cfg.maxFood = 1;
    cfg.maxVirus = 1;
    console.log(ret);


    console.log(Update(0));
    Eject(0,0);
    console.log(Update(0));
    console.log(Update(0));
}

//TestFoo();
