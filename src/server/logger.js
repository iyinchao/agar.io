var log4js = require("log4js");
log4js.configure({
    appenders: {
        everything: {
            type: 'file',
            filename: 'logs/agario.log',
            maxLogSize: 1024 * 1024 * 10,
            backups: 4,
        },
    },
    categories: {
        default: { appenders: ['everything'], level: 'info' }
    },
    replaceConsole: true
});

exports.logger = function() {
    var logger = log4js.getLogger();
    return logger;
};

exports.log4js = log4js;
