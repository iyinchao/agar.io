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
      port: 5001
    },
    server: {
      host: 'http://localhost:3000',
      ws: 'http://localhost:3000'
    }
  },
  production: {
    server: {
      host: 'http://agar.iyinchao.cn:3000',
      ws: 'http://agar.iyinchao.cn:3000'
    }
  },
  cordova: {
    dist: 'src/cordova/www',
    client: {
      dir: '/',
      assetDir: 'static',
      assetPublicPath: '/android_asset/www/'
    },
    server: {
      host: 'http://agar.iyinchao.cn:3000',
      ws: 'http://agar.iyinchao.cn:3000'
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

export default resultConfig;
