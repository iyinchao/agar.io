function GameObject(_id, _type, _mass, _radius)
{
    return {
        id: _id,
        type: _type,
        mass: _mass,
        radius: _radius,
        speed: 0,
        x: 0,
        y: 0,
    };
}

module.exports = GameObject;
