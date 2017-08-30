/**
 * @desc Project configuration (For build and path config)
 * @author Charlieyin<charlieyin@tencent.com>
 */

const utils = require('../scripts/utils')

const configCommon = {
  dist: 'dist',
  client: {
    dir: 'client',
    assetDir: 'static',
    assetPublicPath: '/',
    browserList: ["> 1%", "last 2 versions", "not ie <= 8"]
  },
  devServer: {

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
      host: 'http://localhost:5000'
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
