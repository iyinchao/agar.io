process.env.NODE_ENV = '"development"' // Force env to be 'development'

const path = require('path')
const opn = require('opn')
const shelljs = require('shelljs')
const express = require('express')
const webpack = require('webpack')

const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const config = utils.getProjectConfig()
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
    utils.logger('info', `Cleared build directory: ${utils.dir(config.dist)}`)
  }

  console.log('\n')

  // Start webpack and static server
  let readyPromiseResolve
  const readyPromise = new Promise((resolve, reject) => {
    readyPromiseResolve = resolve
  })

  const app = express()
  const compiler = webpack(webpackConfig)

  const devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    quiet: true
  })

  const hotMiddleware = require('webpack-hot-middleware')(compiler, {
    log: false,
    // To fix HMR ERR_INCOMPLETE_CHUNKED_ENCODING error:
    // see: https://github.com/glenjamin/webpack-hot-middleware/issues/210#issuecomment-305624051
    heartbeat: 2000
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

  let url = ''

  url = config.devServer.host
    ? config.devServer.host
    : `http://localhost:${config.devServer.port}`

  devMiddleware.waitUntilValid((e) => {
    const errors = e.compilation.errors
    if (errors && errors.length) {
      utils.logger('error', `Build FAILED.`)
      process.exit()
    }
    utils.logger('success', `Build SUCCESSFUL.`)
    utils.logger('info', `DevServer is running at ${url}, happy coding!`)
    opn(url)
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
