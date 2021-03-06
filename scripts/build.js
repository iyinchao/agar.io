const path = require('path')
const shelljs = require('shelljs')
const webpack = require('webpack')

const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const config = utils.getProjectConfig()
const webpackConfig = require(utils.dir('config/webpack/webpack.prod.conf'))

process.env.NODE_ENV = '"production"'

;(() => {
  utils.logger('info', 'Start production building... fasten your seatbelt :)')

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

  const compiler = webpack(webpackConfig)
  compiler.run((err, stats) => {
    if (err) {
      console.error(err.stack || err)
      if (err.details) {
        console.error(err.details)
      }
      utils.logger('error', `Build FAILED.`)
      return
    }

    if (stats.compilation.errors &&
    stats.compilation.errors.length) {
      console.log(stats.toString({
        colors: true,
        chunks: false,
        modules: false,
        children: false
      }))
      utils.logger('error', `Build FAILED.`)
    } else {
      console.log(stats.toString({
        colors: true,
        chunks: false,
        children: false,
        modules: false
      }))
      utils.logger('success', `Build SUCCESSFUL.`)
    }
  })
})()
