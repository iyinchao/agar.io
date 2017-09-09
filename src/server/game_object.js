function GameObject(_id, _type, _mass, _radius)
{
    return {
        id: _id,
        type: _type,
        weight: _mass,
        radius: _radius,
        speed: 0,
        x: 0,
        y: 0,
    };
}

function SceneObject(_id, _type, _x, _y, _r)
{
    return {
        id: _id,
        type: _type,
        x: _x,
        y: _y,
        r: _r,
    };
}

exports.GameObject = GameObject;
exports.SceneObject = SceneObject;
