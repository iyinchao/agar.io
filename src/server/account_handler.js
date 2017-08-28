function account_handler() {}

account_handler.mongo_client = require("mongodb").MongoClient;

account_handler.mongo_config = require("./db_config");

var player_data = require("./player_data");

// mongo url, example: mongodb://user:password@127.0.0.1/dbName
account_handler.mongo_url = "mongodb://" + account_handler.mongo_config.user + ":" +
  account_handler.mongo_config.passwd + "@" +
  account_handler.mongo_config.ip + ":" +
  account_handler.mongo_config.port + "/" +
  account_handler.mongo_config.db;

account_handler.agario_db = null;

account_handler.init = function (callback) {
  if (account_handler.agario_db) {
    callback(null, account_handler.agario_db);
    return;
  }

  console.log("Connect to " + account_handler.mongo_url);
  account_handler.mongo_client.connect(account_handler.mongo_url, function (err, db) {
    account_handler.agario_db = db;
    db.on('close', function () {
      delete(account_handler.agario_db);
    });
    callback(err, db);
  });
};

account_handler.create = function (id, passwd, name, callback) {
    account_handler.init(function (error, db) {
        var player_set = db.collection("player");
        var data = new player_data(id, name, passwd, null, 0, 0, 0);

        if (typeof (id) != "string" || typeof (passwd) != "string" ||
                typeof (name) != "string") {
            callback(-1, null);
            return;
        }
        player_set.insert(data, callback);
  });
};

account_handler.update_passwd = function(id, passwd, callback) {
    account_handler.init(function(error, db) {
        var player_set = db.collection('player');
        if (typeof(id) != "string" || typeof(passwd) != "string") {
            callback(-1, null);
            return;
        }
        player_set.update({_id: id}, {$set: {"passwd": passwd}}, callback);
    });
};

account_handler.update_game_data = function(id, mass, kill, game, callback) {
    account_handler.init(function(error, db) {
        var player_set = db.collection('player');
        if (typeof(id) != 'string' || typeof(mass) != 'number' ||
            typeof(kill) != 'number' || typeof(game) != 'number') {
            callback(-1, null);
            return;
        }
        player_set.update({_id: id},
            {$inc: {'weight': mass, 'nr_game': game, 'nr_kill': kill}}, callback);
    });
};

account_handler.find = function (id, passwd, callback) {
    account_handler.init(function (error, db) {
        var player_set = db.collection("player");
        player_set.find({"_id": id, 'passwd': passwd}).toArray(callback);
    });
};

account_handler.top = function (key, count, callback) {
    account_handler.init(function(error, db) {
        var player_set = db.collection("player");
        var sort_key = {};
        sort_key[key] = -1;
        player_set.find().sort(sort_key).limit(count).toArray(callback);
    });
};

account_handler.close = function () {
    if (account_handler.agario_db) {
        account_handler.agario_db.close();
    }
};
module.exports = account_handler;
