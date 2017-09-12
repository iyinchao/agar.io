function GameObject(_id, _type, _mass, _radius)
{
    return {
        id: _id,
        type: _type,
        weight: _mass,
        radius: _radius,
        nickName: null,
        color: 0,
        speed: 0,
        x: 0,
        y: 0,
    };
}

function SceneObject(obj)
{
    return {
        id: obj.id,
        type: obj.type,
        color: obj.color,
        nickName: obj.nickName,
        x: obj.x,
        y: obj.y,
        r: obj.radius,
    };
}

exports.GameObject = GameObject;
exports.SceneObject = SceneObject;
