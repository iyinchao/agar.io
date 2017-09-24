/**
 * @desc Project configuration (For build and path config)
 * @author Charlieyin<charlieyin@tencent.com>
 */

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
      port: 5001,
      // host: 'http://agar-clone.io'
    },
    server: {
      host: 'http://localhost:3000',
      ws: 'http://localhost:3000'
    }
  },
  production: {
    server: {
      host: 'http://45.76.205.64:3000',
      ws: 'http://45.76.205.64:3000'
    }
  }
}

const getConfigForEnv = function (env) {
  return  Object.assign({},
    configCommon,
    config[env] ? config[env] : config['development']
  )
}

const resultConfig = getConfigForEnv(process.env.NODE_ENV)


// module.exports = getConfigForEnv(process.env.NODE_ENV)

export default resultConfig;

// getConfigForEnv(process.env.NODE_ENV)
// module.exports = exports.getConfigForEnv(process.env.NODE_ENV)

// module.exports = {
//   world: {
//     width: 5000,
//     height: 5000
//   }
// };

