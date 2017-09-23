'use strict';
var express = require("express");
var session = require("express-session");
var server = new express();
var http = require('http').createServer(server);
var io = require('socket.io').listen(http);
var account_handler = require("./account_handler");
var logger = require("./logger").logger();
var log4js = require("./logger").log4js;
var ret_data = require("./ret_data");
//zxt


var users = [];
var sockets = {};
var c = require('../../config/config.json');
var util = require('./util');
var initMassLog = util.log(c.defaultPlayerMass, c.slowBase);
//zxt

//server.listen(8080);
var game = require('./game');
var activeGames = []; //用来保存所有的游戏场景id

var logger_style = {
    level: 'auto',
};

var counter = 0;
var update_counter = 0;
// setup global logger
server.use(log4js.connectLogger(logger, logger_style));

// initialize session

server.use(session({
    name: 'skey',
    secret: 'agario',
    resave: false,
    saveUninitialized: false,
}));

logger.info("Create Http Server");

function checker(req, rsp, next)
{
    next();
}

function on_top_n(req, rsp)
{
    var param = req.query;
    if (typeof(param) == "undefined") {
        rsp.json(new ret_data(1, "undefined"));
        logger.info("undefined parameters");
        return;
    }
    var category = param.category;
    var cmp_callback = function(err, db) {
        if (err) {
            return rsp.json(new ret_data(-1, "Internal error"));
        } else {
            var result = [];
            for (var i = 0; i < db.length; ++i) {
                result.push({name: db[i].name, id: db[i]._id});
                result[i][category] = db[i][category];
            }
            return rsp.json(result);
        }
    };
    if (category == "nr_game" || category == "nr_kill" || category == "weight") {
        return account_handler.top(category, 10, cmp_callback);
    } else {
        return rsp.json(new ret_data(-1, "Invalid param"));
    }
}
function check_string(str)
{
    if (typeof(str) == "undefined" || !str)
        return -1;
    if (str.length == 0 || str.length > 20)
        return -2;
    for (var i = 0; i < str.length; ++i) {
        var ascii = str.charAt(i).charCodeAt();
        if (ascii < 32 || ascii > 126)
            return -3;
    }
    return 0;
}

function on_register(req, rsp)
{
    var param = req.query;
    if (typeof(param) == "undefined") {
        rsp.json(new ret_data(1, "undefined params"));
        logger.info("undefine parameters");
        return;
    }
    if (check_string(param.id) || check_string(param.passwd) ||
        check_string(param.name)) {
        rsp.json(new ret_data(2, "invalid param"));
        logger.info("invalid parameters");
        return;
    }
    var reg_callback = function(err, db) {
        if (!err) {
            rsp.json(new ret_data(0, ""));
        } else {
            rsp.json(new ret_data(-1, err));
        }
        logger.info("create new account, ret: " + !!err + "param:" + param);
    };
    account_handler.create(param.id, param.passwd, param.name, reg_callback);
}

function on_login(req, rsp)
{
    var param = req.query;




    if (typeof(param) == "undefined") {
        rsp.json(new ret_data(1, "undefined params"));
        logger.info("undefine parameters");
        return;
    }
    if (check_string(param.id) || check_string(param.passwd)) {
        rsp.json(new ret_data(2, "invalid param"));
        logger.info("invalid parameters");
        return;
    }
    if (req.session._id == param.id) {
        logger.info("check account, login by session");
        return rsp.json(new ret_data(0, "already login"));
    }
    var login_callback = function(err, db) {
        if (!err && db.length >= 1) {
            req.session._id = param.id;
            rsp.json(new ret_data(0, "loin success", db[0].name));
        } else {
            rsp.json(new ret_data(-1, err));
        }
        logger.info("check account, ret: "+ !!err + " param:" + param);
    };
    account_handler.find(param.id, param.passwd, login_callback);
}

function on_exit(req, rsp)
{
    var param = req.query;
    if (req.session._id) {
        logger.info("login out");
        delete(req.session._id);
    }
    return rsp.json(new ret_data(0, ""));
}

function insertNewSocketRecord(gameid, playerid, socketid, playerip)
{
	//var len = activeGames.length;
	var first_pos = -1;
	for(var i=0;i<10000;i++)
	{
		if(activeGames[i] === undefined)
		{
			first_pos = i;
			break;
		}
	}
	if(first_pos>=0 && first_pos<10000)
	{
		activeGames[first_pos] = {gameid:gameid, playerid:playerid, socketid:socketid, playerip:playerip};
	}	
}

function deleteSocketRecord(gameid, playerid)
{
	for(var i=0;i<10000;i++)
	{
		if(activeGames[i] !== undefined && activeGames[i].gameid === gameid && activeGames[i].playerid === playerid)
		{
			console.log("activeGames["+i+"].gameid:"+activeGames[i].gameid);
			console.log("activeGames["+i+"].playerid:"+activeGames[i].playerid);
			activeGames[i].gameid = -1;
			activeGames[i].playerid = -1;
			activeGames[i] = undefined;
		}
	}
}

io.on('connection', function(socket){
		console.log('[INFO] A user connected!!!!');
		var currentPlayer = {
			nickname: "jack"
		};

		socket.on('join', function(player){
			var ret_value = game.Join(player.nickname);
			currentPlayer = player;
			currentPlayer.gameid = ret_value.gameId;
			currentPlayer.playerid = ret_value.playerMainId;
			socket.emit('joined', {gameID: ret_value.gameId, userID:ret_value.playerMainId});
			console.log("Player "+player.nickname+" joined");
			socket.emit('scene-setup', ret_value);
			sockets[socket.id] = socket; //将玩家的socket记录下来
			//if(util.findIndex(activeGames, ret_value.gameId) === -1) //新的游戏场景
			//if(Object.keys(activeGames).indexOf(ret_value.gameId) === -1)//新的游戏场景
			//{
				//console.log("Key:"+Object.keys(activeGames).indexOf(ret_value.gameId));
				//console.log("1111111socket.id: "+socket.id);
				//console.log("1111111gameId: "+ret_value.gameId);
				//console.log("1111111playerID: "+ret_value.playerMainId);
				//var player_and_socket = [];
				//player_and_socket.push({
					//playerIP:socket.request.connection.remoteAddress,
					//playerID:ret_value.playerMainId,
					//socketID:socket.id
				//});
				//activeGames[ret_value.gameId] = player_and_socket;
			//}
			//else//游戏已存在，只是玩家是新加入的
			//{
				//console.log("socket.id: "+socket.id);
				//console.log("gameId: "+ret_value.gameId);
				//console.log("playerID: "+ret_value.playerMainId);
				//activeGames[ret_value.gameId].push({
				//	playerIP:socket.request.connection.remoteAddress,
				//	playerID:ret_value.playerMainId,
				//	socketID:socket.id
				//});
			//}
			//console.log("IP: "+ socket.request.connection.remoteAddress);
			//console.log("socket.id: "+socket.id);
			//console.log("gameId: "+ret_value.gameId);
			//console.log("playerID: "+ret_value.playerMainId);
			var pos = -1;
			for(var i=0;i<10000;i++)
			{
				//console.log("Location 1");
				if(activeGames[i]!== undefined && activeGames[i].gameid === ret_value.gameId && activeGames[i].playerid === ret_value.playerMainId)
				{
					pos = i;
				}	
			}
			if(pos === -1)
			{
				//console.log("Location 2");
				insertNewSocketRecord(ret_value.gameId, ret_value.playerMainId, socket.id, socket.request.connection.remoteAddress);
			}

			for(var i=0;i<10000;i++)
			{
				//console.log("Location 1");
				if(activeGames[i]!== undefined)
				{
					console.log("NewPlayer_GameID :" + activeGames[i].gameid);
					console.log("NewPlayer_PlayerID :" + activeGames[i].playerid);
					console.log("NewPlayer_SocketID :" + activeGames[i].socketid);
					console.log("NewPlayer_PlayerID :" + activeGames[i].playerip);
				}	
			}
			
		});

		socket.on('op', function(op){
			//counter++;
			//console.log("===>socket.id " + socket.id+ " counter: " + counter);
			if(op.t === "mv")//player move
			{
				game.Move(op.gameID, op.userID, op.x, op.y);
			}
			else if(op.t === "w")//split
			{
				game.Eject(op.gameID, op.userID);
			}
			else if(op.t === "space")//space
			{
				game.Split(op.gameID, op.userID);
			}
		});

		socket.on('disconnect', function(){
			console.log('[INFO] Player ' + currentPlayer.nickname + ' disconnected!!');
			console.log('[INFO] Player ' + currentPlayer.gameid + ' disconnected!!');
			console.log('[INFO] Player ' + currentPlayer.playerid + ' disconnected!!');
			deleteSocketRecord(currentPlayer.gameid, currentPlayer.playerid);
		});

});

function sceneUpdate()
{
	var diff = [];
	//update_counter++;
	//Object.keys(activeGames).forEach(function(key){
	//	diff[key] = game.Update(key);
	//	for(var i = 0; i < activeGames[key].length; i++)
	//	{
	//		console.log("<===socket.id " + activeGames[key][i].socketID + " recvd updates:"+update_counter);
	//		sockets[activeGames[key][i].socketID].emit('scene-diff', diff[key]);
			//io.emit('scene-diff', diff[key]);
	//	}
	//});
	for(var i=0;i<1000;i++)
	{
		if(activeGames[i] !== undefined)
		{
			if(diff[activeGames[i].gameid]===undefined)
			{
				diff[activeGames[i].gameid] = game.Update(activeGames[i].gameid);
			}
			sockets[activeGames[i].socketid].emit('scene-diff', diff[activeGames[i].gameid]);
		}
	}
}

server.all("/*", checker);
server.get("/register", on_register);
server.get("/login", on_login);
server.get("/logout", on_exit);
server.get("/top", on_top_n);

setInterval(sceneUpdate, 25);

var ipaddress = '0.0.0.0';
var serverport = '3000';
http.listen(serverport, ipaddress, function(){
	console.log('[INFO] Server is listening on ' + ipaddress + ':' +serverport);
});
