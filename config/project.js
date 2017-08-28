/**
 * @desc Project configuration (For build and path config)
 * @author Charlieyin<charlieyin@tencent.com>
 */

const utils = require('../scripts/utils')

const configCommon = {
  dist: 'dist',
  assetsSubDirectory: 'static',
  assetsPublicPath: '/',
  client: {
    dir: 'client'
  },
  server: {

  }
}

const config = {
  development: {
    devServer: {
      port: 3000
    },
    server: {
      host: 'http://dev.agar-clone.io'
    }
  },
  production: {
    server: {
      host: 'http://agar-clone.io'
    }
  }
}

module.exports = Object.assign({},
  configCommon,
  config[utils.env()] ? config[utils.env()] : config['development']
)
