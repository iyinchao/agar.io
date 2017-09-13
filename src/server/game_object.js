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

function NewSceneObject(obj)
{
    return {
        id: obj.id,
        t: obj.type,
        op: 1,
        hue: obj.color,
        x: obj.x,
        y: cfg.gameHeight - obj.y,
        r: obj.radius,
    };
}

function DeleteSceneObject(obj)
{
    return {
        id: obj.id,
        t: obj.type,
        op: -1,
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

function SceneCell(player, _id)
{
    return {
        id: _id,
        x: player.x,
        y: player.y,
        r: player.radius,
    };
}

exports.GameObject = GameObject;
exports.NewSceneObject = NewSceneObject;
exports.DeleteSceneObject = DeleteSceneObject;
exports.ScenePlayer = ScenePlayer;
exports.SceneCell = SceneCell;
