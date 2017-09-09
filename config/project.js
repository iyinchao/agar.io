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
      port: 5000,
      // host: 'http://agar-clone.io'
    },
    server: {
      host: 'http://localhost:3000',
      ws: 'http://localhost:3000'
    }
  },
  production: {
    server: {
      host: 'http://agar-clone.io',
      ws: 'http://localhost:3000'
    }
  }
}

const getConfigForEnv = function (env) {
  return  Object.assign({},
    configCommon,
    config[env] ? config[env] : config['development']
  )
}

module.exports = getConfigForEnv(utils.env())

