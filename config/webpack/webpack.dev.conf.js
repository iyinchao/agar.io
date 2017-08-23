const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const webpackBaseConf = require('./webpack.base.conf')

// Inject HMR client for entry.
Object.keys(webpackBaseConf.entry).forEach((name) => {
  webpackBaseConf.entry[name] = [utils.dir('scripts/utils/dev-client.js')].concat(webpackBaseConf.entry[name])
})

module.exports = merge(webpackBaseConf, {
  devtool: '#cheap-module-eval-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"'
      }
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new ProgressBarPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: utils.dir('src/client/html/index.html'),
      inject: true
    }),
    new FriendlyErrorsPlugin()
  ]
})

