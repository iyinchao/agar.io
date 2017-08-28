var express = require("express");
var session = require("express-session");

var account_handler = require("./account_handler");
var logger = require("./logger").logger();
var log4js = require("./logger").log4js;
var ret_data = require("./ret_data");

var server = new express();
server.listen(8080);

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

server.all("/*", checker);
server.get("/register", on_register);
server.get("/login", on_login);
server.get("/logout", on_exit);
server.get("/top", on_top_n);
