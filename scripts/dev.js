const path = require('path')
const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const config = require(path.join(baseURL, 'config/project'))
const shelljs = require('shelljs');

(() => {
  // Remove old dist files
  let ret
  ret = shelljs.rm('-rf', utils.dir(config.dist))
  if (ret.stderr) {
    return
  }
  ret = shelljs.mkdir(utils.dir(config.dist))
  if (ret.stderr) {
    return
  }
  //

})()
