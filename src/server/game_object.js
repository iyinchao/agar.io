var cfg = require('../../config/config.json');
var util = require("./util");

function GameObject(_id, _type, _mass, _radius)
{
    return {
        id: _id,
        type: _type,
        weight: _mass,
        radius: _radius,
        color: util.randomInRange(1, 359),
        speed: 0,
        x: 0,
        y: 0,
    };
}

function SceneObject(obj)
{
    return {
        id: obj.id,
        t: obj.type,
        hue: obj.color,
        x: obj.x,
        y: cfg.gameHeight - obj.y,
        r: obj.radius,
    };
}

function ScenePlayer(_t, pg)
{
    return {
        id: pg.id,
        t: _t,
        name: pg.name,
        x: pg.center[0],
        y: pg.center[1],
        hue: pg.color,
        cells: [],
    };
}

exports.GameObject = GameObject;
exports.SceneObject = SceneObject;
exports.ScenePlayer = ScenePlayer;
