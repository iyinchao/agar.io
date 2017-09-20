var cfg = require('../../config/config.json');
var util = require("./util");

function GameObject(_id, _type, _mass, _radius)
{
    return {
        id: _id,
        type: _type,
        weight: _mass,
        r: _radius,
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
        x: parseInt(obj.x),
        y: parseInt(obj.y),
        r: parseInt(obj.radius),
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

function ScenePlayer(_t, pg, _op)
{
    return {
        id: pg.id,
        t: _t,
        weight: 0,
        op: _op,
        name: pg.name,
        x: parseInt(pg.center[0]),
        y: parseInt(pg.center[1]),
        hue: pg.color,
        cells: [],
    };
}

function DeleteScenePlayer(_t, _id)
{
    return {
        id: _id,
        t: _t,
        op: -1,
    };
}

function SceneCell(player, _id)
{
    return {
        id: _id,
        x: parseInt(player.x),
        y: parseInt(player.y),
        r: parseInt(player.radius),
    };
}

exports.GameObject = GameObject;
exports.NewSceneObject = NewSceneObject;
exports.DeleteSceneObject = DeleteSceneObject;
exports.DeleteScenePlayer = DeleteScenePlayer;
exports.ScenePlayer = ScenePlayer;
exports.SceneCell = SceneCell;
