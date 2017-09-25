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
var cors = require('cors');
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
	console.log("Inserting user");
	var first_pos = -1;
	var timestamp = (new Date().getTime())/1000;
	for(var i=0;i<c.maxPlayers;i++)
	{
		if(activeGames[i] === undefined)
		{
			first_pos = i;
			break;
		}
	}
	if(first_pos>=0 && first_pos<c.maxPlayers)
	{
		activeGames[first_pos] = {gameid:gameid, playerid:playerid, socketid:socketid, playerip:playerip, timestamp:timestamp};
	}
}

function deleteSocketRecord(gameid, playerid)
{
	console.log("GameID:"+gameid+ " PlayerID:"+playerid);
	for(var i=0;i<c.maxPlayers;i++)
	{
		if(activeGames[i] !== undefined && activeGames[i].gameid === gameid && activeGames[i].playerid === playerid)
		{
			//console.log("activeGames["+i+"].gameid:"+activeGames[i].gameid);
			//console.log("activeGames["+i+"].playerid:"+activeGames[i].playerid);
			activeGames[i].gameid = -1;
			activeGames[i].playerid = -1;
			activeGames[i] = undefined;
		}
	}
}

function updateTimeStamp(gameID, userID)
{

	//console.log("updateTimeStamp");
	//console.log("updateTimeStamp:"+ gameID);
	//console.log("updateTimeStamp:"+ userID);
	var timestamp = (new Date().getTime())/1000;
	
	for(var i=0;i<c.maxPlayers;i++)
	{
		if(activeGames[i] !== undefined && activeGames[i].gameid === gameID && activeGames[i].playerid === userID)
		{
			//console.log("timestamp:"+timestamp);
			activeGames[i].timestamp = timestamp;
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
			currentPlayer.nickname = player.nickname;
			currentPlayer.gameid = ret_value.gameId;
			currentPlayer.playerid = ret_value.playerMainId;
			socket.emit('joined', {gameID: ret_value.gameId, userID:ret_value.playerMainId});
			console.log("Player "+player.nickname+" joined");
			socket.emit('scene-setup', ret_value);
			sockets[socket.id] = socket; //将玩家的socket记录下来
			var pos = -1;
			for(var i=0;i<c.maxPlayers;i++)
			{
				if(activeGames[i]!== undefined && activeGames[i].gameid === ret_value.gameId && activeGames[i].playerid === ret_value.playerMainId)
				{
					pos = i;
				}
				//if(activeGames[i]!== undefined && activeGames[i].playerip === socket.request.connection.remoteAddress)
				//{
				//	console.log("Zombie is to be deleted");
				//	console.log("PlayerIP:"+activeGames[i].playerip);
				//	game.Exit(activeGames[i].gameid, activeGames[i].playerid);
				//	deleteSocketRecord(activeGames[i].gameid, activeGames[i].playerid);
				//}
			}
			if(pos === -1)
			{
				insertNewSocketRecord(ret_value.gameId, ret_value.playerMainId, socket.id, socket.request.connection.remoteAddress);
			}

			for(var i=0;i<c.maxPlayers;i++)
			{
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
			updateTimeStamp(op.gameID, op.userID);
		//	console.log("In socket op:"+op.gameID);
		//	console.log("In socket op:"+op.userID);
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

		socket.on('playerchart',function(message){
			var msg_sender = message.sender.replace(/(<([^>]+)>)/ig, '');
			var msg_text = message.text.replace(/(<([^>]+)>)/ig, '');
			var game_id = -1;
			for(var i=0;i<c.maxPlayers;i++)
			{
				if(activeGames[i].socketid === socket.id)
				{
					game_id = activeGames[i].gameid;
				}
			}
			for(var i=0;i<c.maxPlayers;i++)
			{
				if(activeGames[i].gametid === game_id)
				{
					sockets[activeGames[i].socketid].emit('playerchatbroadcast',{sender:msg_sender, text:msg_text});
				}
			}
		});
		socket.on('disconnect', function(){
			var gameID = currentPlayer.gameid;
			var PlayerID = currentPlayer.playerid;
			console.log('[INFO] Player_name[' + currentPlayer.nickname + '] disconnected!!');
			console.log('[INFO] Player_GameID[' + currentPlayer.gameid + '] disconnected!!');
			console.log('[INFO] Player_PlayerID[' + currentPlayer.playerid + '] disconnected!!');
			game.Exit(currentPlayer.gameid, currentPlayer.playerid);
			
			deleteSocketRecord(gameID, PlayerID);
			printAllPlayers();
		});

		socket.on('exit', function(message){
			console.log("Socket_ID:"+ socket.id);
			socket.emit('exited', "You are exited!");
			console.log('[INFO] Player_name[' + currentPlayer.nickname + '] exited!');
			console.log('[INFO] Player_GameID[' + currentPlayer.gameid + '] exited!');
			console.log('[INFO] Player_PlayerID[' + currentPlayer.playerid + '] exited!');
			if(message.gameID !== undefined && message.userID !== undefined)
			{
				game.Exit(message.gameID, message.userID);
			}
		});

		socket.on('heartbeat', function(message){
			updateTimeStamp(message.gameID, message.userID);
		});
});

function sceneUpdate()
{
	var diff = [];
	for(var i=0;i<c.maxPlayers;i++)
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

function cleanZombeUsers()
{
	var timestamp = (new Date().getTime())/1000;
	var gameID;
	var playerID;
	for(var i=0;i<c.maxPlayers;i++)
	{
		if(activeGames[i] != undefined)
		{
			//console.log("TimeStampNow:"+timestamp);
			//console.log("TimeStampLast:"+activeGames[i].timestamp);
			if(timestamp - activeGames[i].timestamp >= 10)
			{
				gameID = activeGames[i].gameid;
				playerID = activeGames[i].playerid;
				//console.log("CleanZombe_GameID:"+gameID);
				//console.log("CleanZombe_PlayerID:"+playerID);
				game.Exit(activeGames[i].gameid, activeGames[i].playerid);
				sockets[activeGames[i].socketid].emit("exited", "No player input, kick off");
				sockets[activeGames[i].socketid].disconnect();
				activeGames[i].gameid = -1;
				activeGames[i].playerid = -1;
				activeGames[i].playerip = -1;
				activeGames[i].timestamp = -1;
				activeGames[i] = undefined;
			}
		}	
	}
}

// Allow cors
server.use(cors())

server.all("/*", checker);
server.get("/register", on_register);
server.get("/login", on_login);
server.get("/logout", on_exit);
server.get("/top", on_top_n);

setInterval(sceneUpdate, 25);
//setInterval(cleanZombeUsers, 10000);
var ipaddress = '0.0.0.0';
var serverport = '3000';
http.listen(serverport, ipaddress, function(){
	console.log('[INFO] Server is listening on ' + ipaddress + ':' +serverport);
});

function TestFoo()
{
	c.maxFood = 0;
	c.maxVirus = 0;
	var ret1;
	var ret2;
	var ret3;
	ret1 = game.Join('player1');
	ret2 = game.Join('player2');
	ret3 = game.Join('player3');

	console.log("GameID1:"+ret1.gameId+" UserID1:"+ret1.playerMainId);
	console.log("GameID2:"+ret2.gameId+" UserID2:"+ret2.playerMainId);
	console.log("GameID3:"+ret3.gameId+" UserID3:"+ret3.playerMainId);

	game.Update(ret1.gameId);
	game.Update(ret2.gameId);
	game.Update(ret3.gameId);

	game.Exit(ret1.gameId, ret1.playerMainId);

	console.log(game.Update(ret2.gameId));
	console.log(game.Update(ret3.gameId));
}

function printAllPlayers()
{
	for(var i=0;i<c.maxPlayers;i++)
	{
		if(activeGames[i]!==undefined)
		{
			console.log("Player["+i+"]:");
			console.log("{");
			console.log("   [GameID]:"+activeGames[i].gameid);
			console.log("   [PlayerID]:"+activeGames[i].playerid);
			console.log("   [PlayerIP]:"+activeGames[i].playerip);
			console.log("   [Timestamp]:"+activeGames[i].timestamp);
			console.log("}");
		}
	}
}
//TestFoo();