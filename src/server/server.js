var express = require("express");
var session = require("express-session");

var account_handler = require("./account_handler");
var logger = require("./logger").logger();
var log4js = require("./logger").log4js;
var ret_data = require("./ret_data");
//zxt 
var http = require('http').Server(server);
var io = require('socket.io')(http);
var users = [];
var food = [];
var massFood = [];
var virus = [];
var sockets = {};
var c = require('../../config/config.json');
var util = require('./util');
var initMassLog = util.log(c.defaultPlayerMass, c.slowBase);
//zxt
var server = new express();
//server.listen(8080);

var logger_style = {
    level: 'auto',
};

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
                result.push({name: db[i].name});
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
            rsp.json(new ret_data(0, "loin success"));
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

function addFood(numToAdd)
{
	var radius = 10;
	while(numToAdd--)
	{
		var position = util.randomPosition(radius);
		food.push({
			id: ((new Date()).getTime() + '' + food.length) >>> 0,
			x: position.x,
			y: position.y,
			radius: radius,
			mass: Math.random() + 2,
			hue: Math.round(Math.random() * 360)
		});
	}
}

function addVirus(numToAdd)
{
	while(numToAdd--)
	{
		var mass = util.randomInRange(c.virus.defaultMass.from, c.virus.defaultMass.to, true);
		var radius = util.massToRadius(mass);
		var position = util.randomPosition(radius);
		virus.push({
			id: ((new Date()).getTime() + '' + virus.length) >>> 0,
			x: position.x,
			y: position.y,
			radius: radius,
			mass: mass,
			fill: c.virus.fill,
			stroke: c.virus.stroke,
			strokeWidth: c.virus.strokeWidth
		});
	}
}
io.on('connection', function(socket){
		console.log('[INFO] A user connected!!!!');
		var type = socket.handshake.query.type;
		var radius = util.massToRadius(c.defaultPlayerMass);
		var position = util.randomPosition(radius);
		var cells = [];
		var massTotal = 0;
		if(type === 'player')
		{
			cells = [{
				mass: c.defaultPlayerMass,
				x: position.x,
				y: position.y,
				radius: radius
			}];
			massTotal = c.defaultPlayerMass;
		}
		
		var currentPlayer = {
			id: socket.id,
			x: position.x,
			y: position.y,
			w: c.defaultPlayerMass,
			h: c.defaultPlayerMass,
			cells: cells,
			massTotal: massTotal,
			hue: Math.round(Math.random() * 360),
			type: type,
			lastHeartbeat: new Date().getTime(),
			target: {
				x: 0,
				y: 0
			}
		};
		
		socket.on('playerlogin', function(player){
			console.log('[INFO] Player ' + player.name + ' connecting !');
			if(util.findUser(users, player.id) > -1) //玩家列表里已存在
			{
				console.log('[INFO] Player is already in, kicking off');
				socket.disconnect();
			}
			else
			{
				console.log('[INFO] Player ' + player.name + ' connected');
				sockets[player.id] = socket; //将玩家的socket记录下来
				var radius = util.massToRadius(c.defaultPlayerMass);
				var position = util.randomPosition(radius);
				player.x = position.x;
				player.y = position.y;
				player.target.x = 0;  //用来记录玩家移动时的目标位置，指导移动，由前端传入
				player.target.y = 0;
				if(type === 'player')
				{
					player.cells = [{
						mass: c.defaultPlayerMass,
						x: position.x,
						y: position.y,
						radius: radius
					}];
					player.massTotal = c.defaultPlayerMass; //总体积大小
				}
				else
				{
					player.cells = [];
					player.massTotal = 0;
				}
				player.hue = Math.round(Math.random() * 360);
				currentPlayer = player;
				currentPlayer.lastHeartbeat = new Date().getTime();
				users.push(currentPlayer); //将当前玩家加入到玩家列表
				io.emit('playerJoin', { name: currentPlayer.name}); //io.emit是发送给所有玩家
				socket.emit('gameSetup', {
					gameWidth: c.gameWidth,
					gameHeight: c.gameHeight
				});
				console.log('Total players: ' + users.length);
			}
		});
		
		socket.on('pingcheck', function(){
			console.log('Recv client\'s message pingcheck');
			socket.emit('pingcheck','this is pingcheck test');
		});
		
		socket.on('disconnect', function(){
			var pos = util.findUser(users, currentPlayer.id); //找到玩家当前位置
			if(pos > -1)
			{
				users.splice(pos, 1); //删除当前玩家
			}
			console.log('[INFO] Player ' + currentPlayer.name + ' disconnected!!');
			socket.broadcast.emit('playerDisconnected', {name: currentPlayer.name});
		});
		
		socket.on('updatetarget', function(target){
			console.log("Recv message 0");
			currentPlayer.lastHeartbeat = new Date().getTime();
			if(target.x !== currentPlayer.x || target.y !== currentPlayer.y)
			{
				currentPlayer.target = target;
			}
			socket.emit('testconnection', 'This is a test');
		});
		
		socket.on('2', function(virusCell){
			function splitCell(cell){//分裂
				if(cell.mass >= c.defaultPlayerMass*2){//体积至少要大于或等于两倍最小玩家大小
					cell.mass = cell.mass/2;
					cell.radius = util.massToRadius(ceil.mass);
					currentPlayer.cells.push({
						mass: cell.mass,
						x: cell.x,
						y: ceil.y,
						radius: ceil.radius,
						speed: 25
					});
				}
			}
			//分身数不能超过16，并且体积大于等于两倍默认体积
			if(currentPlayer.ceils.length < c.limitSplit && currentPlayer.massTotal >= c.defaultPlayerMass*2){
				if(virusCell)
				{
					splitCell(currentPlayer.ceils[virusCell]);
				}
				else
				{
					if(currentPlayer.cells.length < c.limitSplit && currentPlayer.massTotal >= c.defaultPlayerMass*2){
						var numMax = currentPlayer.cells.length;
						for(var d=0; d<numMax; d++)
						{
							splitCell(currentPlayer.cells[d]);
						}
					}
				}
				currentPlayer.lastSplit = new Date().getTime();
			}
	
	});
});

function sendUpdates()
{
		//console.log("[INFO] Updates Sent!");
	    users.forEach( function(u) {
        u.x = u.x || c.gameWidth / 2;
        u.y = u.y || c.gameHeight / 2;
        var visibleFood  = food //玩家视野内的食物
            .map(function(f) {
                if ( f.x > u.x - u.screenWidth/2 - 20 &&
                    f.x < u.x + u.screenWidth/2 + 20 &&
                    f.y > u.y - u.screenHeight/2 - 20 &&
                    f.y < u.y + u.screenHeight/2 + 20) {
                    return f;
                }
            })
            .filter(function(f) { return f; });

        var visibleVirus  = virus //玩家视野内的病毒
            .map(function(f) {
                if ( f.x > u.x - u.screenWidth/2 - f.radius &&
                    f.x < u.x + u.screenWidth/2 + f.radius &&
                    f.y > u.y - u.screenHeight/2 - f.radius &&
                    f.y < u.y + u.screenHeight/2 + f.radius) {
                    return f;
                }
            })
            .filter(function(f) { return f; });

        var visibleMass = massFood //玩家视野内的营养块
            .map(function(f) {
                if ( f.x+f.radius > u.x - u.screenWidth/2 - 20 &&
                    f.x-f.radius < u.x + u.screenWidth/2 + 20 &&
                    f.y+f.radius > u.y - u.screenHeight/2 - 20 &&
                    f.y-f.radius < u.y + u.screenHeight/2 + 20) {
                    return f;
                }
            })
            .filter(function(f) { return f; });

        var visibleCells  = users //玩家视野内的别的玩家
            .map(function(f) {
                for(var z=0; z<f.cells.length; z++)
                {
                    if ( f.cells[z].x+f.cells[z].radius > u.x - u.screenWidth/2 - 20 &&
                        f.cells[z].x-f.cells[z].radius < u.x + u.screenWidth/2 + 20 &&
                        f.cells[z].y+f.cells[z].radius > u.y - u.screenHeight/2 - 20 &&
                        f.cells[z].y-f.cells[z].radius < u.y + u.screenHeight/2 + 20) {
                        z = f.cells.lenth;
                        if(f.id !== u.id) {
                            return {
                                id: f.id,
                                x: f.x,
                                y: f.y,
                                cells: f.cells,
                                massTotal: Math.round(f.massTotal),
                                hue: f.hue,
                                name: f.name
                            };
                        } else {
                            return {
                                x: f.x,
                                y: f.y,
                                cells: f.cells,
                                massTotal: Math.round(f.massTotal),
                                hue: f.hue,
                            };
                        }
                    }
                }
            })
            .filter(function(f) { return f; });

        sockets[u.id].emit('serverTellPlayerMove', visibleCells,visibleFood,visibleMass,visibleVirus);
		//发送这些信息给玩家
		//sockets[u.id].emit('testsendupdates', 'this is a test for sent update');
		//socket.broadcast.emit('testsendupdates', 'this is a test for sent update');
        
    });

}

function elementsBalance()
{
	var foodToadd = c.maxFood - food.length;
	var virusToadd = c.maxVirus - virus.length;
	if(foodToadd > Math.round(c.maxFood * 0.1)) //屏幕上的食物不到食物上限的90%，就增加食物
	{
		addFood(foodToadd);
	}
	
	if(virusToadd > Math.round(c.maxVirus * 0.1)) //屏幕上的病毒不足病毒上线的90%, 增加病毒
	{
		addVirus(virusToadd);
	}
}

function movePlayer(player)
{
	var x = 0, y = 0;
	for(var i=0;i<player.cells.length;i++)//针对每一个玩家的分身执行移动操作
	{
		var target = {
			x: player.x - player.cells[i].x + player.target.x,
			y: player.y - player.cells[i].y + player.target.y
		};
		var dist = Math.sqrt(Math.pow(target.x, 2) + Math.pow(target.y, 2));//距离
		var deg = Math.atan2(target.y, target.x);
		var slowDown = 1;
		if(player.cells[i].speed <= 6.25)
		{
			slowDown = util.log(player.cells[i].mass, c.slowBase) - initMassLog + 1;
		}
		var deltaY = player.cells[i].speed*Math.sin(deg)/slowDown;
		var deltaX = player.cells[i].speed*Math.cos(deg)/slowDown;
		if(player.cells[i].speed > 6.25)
		{
			player.cells[i].speed -= 0.5;
		}
		if(dist < (50 + player.cells.radius)){
			deltaY *= dist / (50 + player.cells[i].radius);
			deltaX *= dist / (50 + player.cells[i].radius);
		}
		if (!isNaN(deltaY)) {
            player.cells[i].y += deltaY;
        }
        if (!isNaN(deltaX)) {
            player.cells[i].x += deltaX;
        }
        for(var j=0; j<player.cells.length; j++) {
            if(j != i && player.cells[i] !== undefined) {
                var distance = Math.sqrt(Math.pow(player.cells[j].y-player.cells[i].y,2) + Math.pow(player.cells[j].x-player.cells[i].x,2));
                var radiusTotal = (player.cells[i].radius + player.cells[j].radius);
                if(distance < radiusTotal) {
                    if(player.lastSplit > new Date().getTime() - 1000 * c.mergeTimer) {
                        if(player.cells[i].x < player.cells[j].x) {
                            player.cells[i].x--;
                        } else if(player.cells[i].x > player.cells[j].x) {
                            player.cells[i].x++;
                        }
                        if(player.cells[i].y < player.cells[j].y) {
                            player.cells[i].y--;
                        } else if((player.cells[i].y > player.cells[j].y)) {
                            player.cells[i].y++;
                        }
                    }
                    else if(distance < radiusTotal / 1.75) {
                        player.cells[i].mass += player.cells[j].mass;
                        player.cells[i].radius = util.massToRadius(player.cells[i].mass);
                        player.cells.splice(j, 1);
                    }
                }
            }
        }
        if(player.cells.length > i) {
            var borderCalc = player.cells[i].radius / 3;
            if (player.cells[i].x > c.gameWidth - borderCalc) {
                player.cells[i].x = c.gameWidth - borderCalc;
            }
            if (player.cells[i].y > c.gameHeight - borderCalc) {
                player.cells[i].y = c.gameHeight - borderCalc;
            }
            if (player.cells[i].x < borderCalc) {
                player.cells[i].x = borderCalc;
            }
            if (player.cells[i].y < borderCalc) {
                player.cells[i].y = borderCalc;
            }
            x += player.cells[i].x;
            y += player.cells[i].y;
        }
    }
    player.x = x/player.cells.length;
    player.y = y/player.cells.length;
}

server.all("/*", checker);
server.get("/register", on_register);
server.get("/login", on_login);
server.get("/logout", on_exit);

setInterval(sendUpdates, 1000);
setInterval(elementsBalance, 3000);

var ipaddress = '0.0.0.0';
var serverport = '3000';
http.listen(serverport, ipaddress, function(){
	console.log('[INFO] Server is listening on ' + ipaddress + ':' +serverport);
});
