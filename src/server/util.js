'use strict';
var cfg = require('../../config/config.json');

exports.massToRadius = function(mass)
{
	return 4 + Math.sqrt(mass) * 6;
};

//计算两个物体之间的距离  根号((x1-x2)^2  + (y1-y2)^2) - r1 - r2
exports.getDistance = function(p1, p2)
{
	return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) - p1.radius - p2.radius;
};

//生成指定范围内的随机整数
exports.randomInRange = function (from, to) {
    return Math.floor(Math.random() * (to - from)) + from;
};

exports.log = (function () {
	var log = Math.log;
	return function (n, base) {
		return log(n) / (base ? log(base) : 1);
	};
})();

//在当前区域内生成一个随机位置
exports.randomPosition = function (radius) {
    return {
        x: exports.randomInRange(radius, cfg.gameWidth - radius),
        y: exports.randomInRange(radius, cfg.gameHeight - radius)
    };
};

exports.uniformPosition = function(points, radius)
{
	var bestCandidate, maxDistance = 0;
	var numberOfCandidates = 10;
	if(points.length === 0)
	{
		return exports.randomPosition(radius);
	}
	for(var ci = 0; ci < numberOfCandidates; ci++)
	{
		var minDistance = Infinity;
		var candidate = exports.randomPosition(radius);
		candidate.radius = radius;
		for(var pi = 0; pi <points.length;pi++)
		{
			var distance = exports.getDistance(candidate, points[pi]);
			if(distance < minDistance)
			{
				minDistance = distance;
			}
		}
		if(minDistance > maxDistance)
		{
			bestCandidate = candidate;
			maxDistance = minDistance;
		}
		else
		{
			return exports.randomPosition(radius);
		}
		
	}
	return bestCandidate;
}

exports.findUser = function(userlist, id)
{
	var pos = userlist.length;
	while(pos--)
	{
		if(userlist[pos].id === id)
		{
			return pos;
		}
	}
	return -1;
};
