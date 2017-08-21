const path = require('path')
const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const config = require(path.join(baseURL, 'config/project'))

module.exports = {
  context: utils.dir(),
  output: {
    path: utils.dir(config.dist),
    publicPath: utils.dir(config.assetsPath)
  }
}

console.log(module.exports)
