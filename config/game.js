/**
 * @desc Game parameters
 * @author Charlieyin<charlieyin@tencent.com>
*/

module.exports = {
  world: {
    width: 5000,
    height: 5000
  },
  food: {
    valueRange: [1, 3],
    v2r: 20
  },
  virus: {
    color: [0, 1, 0, 1]
  },
  player: {
    maxCells: 16,
    v2r: 20,
    initialValue: 20
  }
};
