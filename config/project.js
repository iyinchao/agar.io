/**
 * @desc Project configuration (For build and path config)
 * @author Charlieyin<charlieyin@tencent.com>
 */

const utils = require('../scripts/utils')

const configCommon = {
  dist: 'dist',
  assetsPath: 'dist/assets'
}

const config = {
  development: {

  },
  production: {

  }
}

module.exports = Object.assign(
  {},
  configCommon,
  config[utils.env()] ? config[utils.env()] : config['development']
)
