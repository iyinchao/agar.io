process.env.NODE_ENV = '"development"' // Force env to be 'development'

const path = require('path')
const shelljs = require('shelljs')
const express = require('express')
const webpack = require('webpack')
const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const config = require(utils.dir('config/project'))
const webpackConfig = require(utils.dir('config/webpack/webpack.dev.conf'))

;(() => {
  utils.logger('info', 'Starting dev server...')
  // Remove old dist files
  let ret
  ret = shelljs.rm('-rf', utils.dir(config.dist))
  if (ret.stderr) {
    utils.logger('error', 'Failed to remove "dist" folder. Stop.', ret.stderr)
    return
  }
  // Create dist folder
  ret = shelljs.mkdir(utils.dir(config.dist))
  if (ret.stderr) {
    utils.logger('error', 'Failed to create "dist" folder. Stop.', ret.stderr)
    return
  } else {
    utils.logger('info', 'Cleared "dist" folder.')
  }

  // Start webpack and static server
  let readyPromiseResolve
  const readyPromise = new Promise(resolve => {
    readyPromiseResolve = resolve
  })

  const app = express()
  const compiler = webpack(webpackConfig)

  const devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    quiet: true
  })

  const hotMiddleware = require('webpack-hot-middleware')(compiler, {
    log: false
  })

  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
      hotMiddleware.publish({ action: 'reload' })
      cb()
    })
  })

  app.use(devMiddleware)
  app.use(hotMiddleware)

  app.use(utils.dir(`${config.dist}/${config.client.dir}/${config.assetsSubDirectory}`), express.static('./static'))

  devMiddleware.waitUntilValid(() => {
    utils.logger('success', `Build is now valid.`)
    utils.logger('info', `DevServer is running at http://localhost:${config.devServer.port}, happy coding!`)
    readyPromiseResolve()
  })

  const server = app.listen(config.devServer.port)

  module.exports = {
    ready: readyPromise,
    close: () => {
      server.close()
    }
  }
})()
