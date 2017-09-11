'use strict';
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
var foodChange = [];
var virusChange = [];
var massFoodChange = [];
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
		var id = ((new Date()).getTime() + '' + food.length) >>> 0;
		var hue = Math.round(Math.random() * 360);
		food.push({
			id: id,
			x: position.x,
			y: position.y,
			radius: radius,
			mass: Math.random() + 2,
			hue: hue
		});
		foodChange.push({
			id: id,
			x: position.x,
			y: position.y,
			radius: radius,
			hue: hue,
			op: 1
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
		var id = ((new Date()).getTime() + '' + virus.length) >>> 0;
		virus.push({
			id: id,
			x: position.x,
			y: position.y,
			radius: radius,
			mass: mass,
			fill: c.virus.fill,
			stroke: c.virus.stroke,
			strokeWidth: c.virus.strokeWidth
		});
		virusChange.push({
			id: id,
			x: position.x,
			y: position.y,
			radius: radius,
			fill: c.virus.fill,
			op: 1
		});
	}
}

function addMassFood(numToAdd)
{
	while(numToAdd--)
	{
		var mass = c.fireFood;
		var radius = util.massToRadius(mass);
		var position = util.randomPosition(radius);
		var id = ((new Date()).getTime() + '' + virus.length) >>> 0;
		massFood.push({
			id: id,
			x: position.x,
			y: position.y,
			radius: radius,
			mass: mass/////////色彩还没处理
		});
		massFoodChange.push({
			id: id,
			x: position.x,
			y: position.y,
			radius: radius,
			op: 1
		});
	}
}

io.on('connection', function(socket){
		console.log('[INFO] A user connected!!!!');
		var type = 'player';//socket.handshake.query.type;
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
			player.id = socket.id;
			console.log('[INFO] Player ' + player.id + ' connecting !');
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
					}]
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
				io.emit('playerJoin', { id: currentPlayer.id}); //io.emit是发送给所有玩家
				socket.emit('gameSetup', {
					id: player.id,
					x: player.x,
					y: player.y,
					gameWidth: c.gameWidth,
					gameHeight: c.gameHeight,
					allFood: food,
					allVirus: virus,
					allMassFood: massFood,
					allPlayers: users
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
			console.log("target.x:"+target.x+" target.y:"+target.y);
			currentPlayer.lastHeartbeat = new Date().getTime();
			if(target.x !== currentPlayer.x || target.y !== currentPlayer.y)
			{
				target.x = currentPlayer.x + target.x - currentPlayer.screenWidth/2;
				target.y = currentPlayer.y + target.y - currentPlayer.screenHeight/2;
				currentPlayer.target = target;
			}
			console.log("currentPlayer.x:"+currentPlayer.x+"  currentPlayer.y:"+currentPlayer.y);
			console.log("screenWidth/2:"+currentPlayer.screenWidth/2+"   screenHeight/2:"+currentPlayer.screenHeight/2);
			console.log("Recv message updatetarget：{ x:"+target.x+", y: " + target.y + "}");
			//socket.emit('testconnection', 'This is a test');
		});

		socket.on('dividCell', function(virusCell){
			function splitCell(cell){//分裂
				if(cell.mass >= c.defaultPlayerMass*2){//体积至少要大于或等于两倍最小玩家大小
					cell.mass = cell.mass/2;
					cell.radius = util.massToRadius(ceil.mass);
					currentPlayer.cells.push({
						mass: cell.mass,
						x: cell.x,
						y: cell.y,
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

		socket.on('spitMass', function(player){
			//对于player的每一个cell，如果这个cell尺寸达到吐营养科的标准，则吐营养块
			//营养块移动一个位置
			//营养块数组增加
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

        var visibleCells  = users//玩家视野内的玩家
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
                            //console.log("Nombre: " + f.name + " Es Usuario");
                            return {
								id: f.id,
                                x: f.x,
                                y: f.y,
                                cells: f.cells,
                                massTotal: Math.round(f.massTotal),
                                hue: f.hue,
								name: f.name
                            };
                        }
                    }
                }
            })
            .filter(function(f) { return f; });
		//visibleCells.push(users[u]);
        //sockets[u.id].emit('serverTellPlayerMove', visibleCells,visibleFood,visibleMass,visibleVirus);
		//发送这些信息给玩家
		//sockets[u.id].emit('testsendupdates', 'this is a test for sent update');
		//socket.broadcast.emit('testsendupdates', 'this is a test for sent update');
        //sockets[u.id].emit('serverTellPlayerMove', {"users":users, "food":food, "virus":virus, "massFood":massFood});
		
		//console.log('users[u].id:'+u.id);
		sockets[u.id].emit('serverTellPlayerMove', {"visibleCells":users, "foodChange":foodChange,"massFoodChange":massFoodChange,"virusChange":virusChange});
    });

}

function elementsBalance()
{
	foodChange = [];
	virusChange = [];
	massFoodChange = [];
	
	var foodToadd = c.maxFood - food.length;
	var virusToadd = c.maxVirus - virus.length;
	var massFoodToAdd = c.maxMassFood - massFood.length;
	if(foodToadd > Math.round(c.maxFood * 0.1)) //屏幕上的食物不到食物上限的90%，就增加食物
	{
		addFood(foodToadd);
	}

	if(virusToadd > Math.round(c.maxVirus * 0.1)) //屏幕上的病毒不足病毒上线的90%, 增加病毒
	{
		addVirus(virusToadd);
	}

	if(massFoodToAdd > Math.round(c.fireFood * 0.1))
	{
		addMassFood(massFoodToAdd);
	}

}

function gameLoop()
{
	for (var i = 0; i < users.length; i++) {
        doPlayerMoveLogic(users[i]);
    }
}

function eatFood(player, player_start_position)
{
	if(player.x >= player_start_position.x && player.y <= player_start_position.y)//第一象限
	{
		for(var i=0; i<food.length; i++)
		{
			if(food[i].x >= player_start_position.x && food[i].x <= player.x)
			{
				var routine_y = player_start_position.y - ((player_start_position.y - player.y)/(player.x - player_start_position.x))*(food[i].x - player_start_position.x);
				if(routine_y - player.radius < food[i].y && food[i].y < routine_y + player.radius) // 在范围之内
				{
					foodChange.push({
						id: food[i].id,
						x: food[i].x,
						y: food[i].y,
						radius: food[i].radius,
						hue: food[i].hue,
						op: -1
					});
					player.mass += 1;
					food.splice(i,1);//删除食物
					
					player.radius = util.massToRadius(player.mass);
				}
			}
		}
	}
	else if(player.x < player_start_position.x && player.y <= player_start_position.y)//第二象限
	{
		for(var i=0; i<food.length; i++)
		{
			var routine_y = player_start_position.y - ((player_start_position.y - player.y)/(player_start_position.x - player.x))*(player_start_position.x - food[i].x);
			if(routine_y - player.radius < food[i].y && food[i].y < routine_y + player.radius) // 在范围之内
			{
				foodChange.push({
					id: food[i].id,
					x: food[i].x,
					y: food[i].y,
					radius: food[i].radius,
					hue: food[i].hue,
					op: -1
				});
				player.mass += 1;
				food.splice(i,1);//删除食物
				
				player.radius = util.massToRadius(player.mass);
			}
		}
	}
	else if(player.x <= player_start_position.x && player.y > player_start_position.y)
	{
		for(var i=0; i<food.length; i++)
		{
			var routine_y = player_start_position.y - ((player_start_position.y - player.y)/(player.x - player_start_position.x))*(food[i].x - player_start_position.x);
			if(routine_y - player.radius < food[i].y && food[i].y < routine_y + player.radius) // 在范围之内
			{
				foodChange.push({
					id: food[i].id,
					x: food[i].x,
					y: food[i].y,
					radius: food[i].radius,
					hue: food[i].hue,
					op: -1
				});
				player.mass += 1;
				food.splice(i,1);//删除食物
				
				player.radius = util.massToRadius(player.mass);
			}
		}
	}
	else //if(player.x > player_start_position.x && player.y > player_start_position.y)
	{
		for(var i=0; i<food.length; i++)
		{
			var routine_y = player_start_position.y - ((player_start_position.y - player.y)/(player.x - player_start_position.x))*(food[i].x - player_start_position.x);
			if(routine_y - player.radius < food[i].y && food[i].y < routine_y + player.radius) // 在范围之内
			{
				foodChange.push({
					id: food[i].id,
					x: food[i].x,
					y: food[i].y,
					radius: food[i].radius,
					hue: food[i].hue,
					op: -1
				});
				player.mass += 1;
				food.splice(i,1);//删除食物
				
				player.radius = util.massToRadius(player.mass);
			}
		}
	}
}

function eatVirus(player, player_start_position)
{
}

function meetOtherPlayer(player, player_start_position)
{
}

function doPlayerMoveLogic(player)
{
	
	
	movePlayer(player);//这一段时间间隔，只是计算出下一帧的位置，实际上还并未移动
	
	//eatVirus(player, player_start_position);//计算在这一帧，轨迹扫过的地方，覆盖了哪些病毒，吃掉
	//meetOtherPlayer(player, player_start_position);//计算在这一帧，轨迹扫过的地方，有没有遇到其它玩家
}

function movePlayer(player)
{
	var player_start_position = player;
	var x = 0, y = 0;
	for(var i=0;i<player.cells.length;i++)//针对每一个玩家的分身执行移动操作
	{
		var distance = Math.sqrt(Math.pow(player.cells[i].x - player.target.x,2) + Math.pow(player.cells[i].y - player.target.y, 2));
		console.log("distance:"+distance);
		var speed =2 + 5*c.slowBase/player.cells[i].mass;
		console.log("speed:"+speed);
		var deltaDis = (speed * c.networkUpdateFactor)/10;
		console.log("deltaDis:"+deltaDis);
		var deltaX;
		var deltaY;
		if(player.target.x >= player.cells[i].x && player.target.y <= player.cells[i].y)//第一象限
		{
			deltaX = ((player.target.x - player.cells[i].x)/distance) * deltaDis;
			deltaY = ((player.cells[i].y - player.target.y)/distance) * deltaDis;

			if(player.cells[i].x + deltaX >= c.gameWidth)//边界保护
			{
				player.cells[i].x = c.gameWidth - 10;
			}
			else
			{
				player.cells[i].x += deltaX;
			}
			if(player.cells[i].y - deltaY <= 0)//边界保护
			{
				player.cells[i].y = 10;
			}
			else
			{
				player.cells[i].y -= deltaY;
			}
		}
		else if(player.target.x <= player.cells[i].x && player.target.y <= player.cells[i].y)//第二象限
		{
			deltaX = ((player.cells[i].x - player.target.x)/distance) * deltaDis;
			deltaY = ((player.cells[i].y - player.target.y)/distance) * deltaDis;
			if(player.cells[i].x - deltaX <= 0)
			{
				player.cells[i].x = 10;
			}
			else
			{
				player.cells[i].x -= deltaX;
			}
			if(player.cells[i].y - deltaY <= 0)
			{
				player.cells[i].y = 10;
			}
			else
			{
				player.cells[i].y -= deltaY;
			}
		}
		else if(player.target.x < player.cells[i].x && player.target.y >= player.cells[i].y)//第三象限
		{
			deltaX = ((player.cells[i].x - player.target.x)/distance) * deltaDis;
			deltaY = ((player.target.y - player.cells[i].y)/distance) * deltaDis;

			if(player.cells[i].x - deltaX <= 0)
			{
				player.cells[i].x = 10;
			}
			else
			{
				player.cells[i].x -= deltaX;
			}
			if(player.cells[i].y + deltaY >= c.gameHeight)
			{
				player.cells[i].y = c.gameHeight - 10;
			}
			else
			{
				player.cells[i].y += deltaY;
			}
		}
		else   //第四象限
		{
			deltaX = ((player.target.x - player.cells[i].x)/distance) * deltaDis;
			deltaY = ((player.target.y - player.cells[i].y)/distance) * deltaDis;
			if(player.cells[i].x + deltaX >= c.gameWidth)
			{
				player.cells[i].x = c.gameWidth - 10;
			}
			else
			{
				player.cells[i].x += deltaX;
			}
			if(player.cells[i].y + deltaY >= c.gameHeight)
			{
				player.cells[i].y = c.gameHeight - 10;
			}
			else
			{
				player.cells[i].y += deltaY;
			}
		}
		x += player.cells[i].x;
		y += player.cells[i].y;
		eatFood(player.cells[i], player_start_position);//计算在这一帧，轨迹扫过的地方，覆盖了哪些食物，吃掉
    }
	player.x = x/player.cells.length;
    player.y = y/player.cells.length;
	
}

function massLoss()
{
	for(var i=0;i<users.length;i++)
	{
		users[i].mass--;
	}
}

server.all("/*", checker);
server.get("/register", on_register);
server.get("/login", on_login);
server.get("/logout", on_exit);

setInterval(gameLoop, 40);
setInterval(sendUpdates, 1000/c.networkUpdateFactor);
setInterval(elementsBalance, 3000);
setInterval(massLoss, 1000);


var ipaddress = '0.0.0.0';
var serverport = '3000';
http.listen(serverport, ipaddress, function(){
	console.log('[INFO] Server is listening on ' + ipaddress + ':' +serverport);
});
