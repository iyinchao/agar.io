const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const webpackBaseConf = require('./webpack.base.conf')
const config = require(path.join(baseURL, 'config/project'))

// Inject HMR client for entry.
Object.keys(webpackBaseConf.entry).forEach((name) => {
  webpackBaseConf.entry[name] = [utils.dir('scripts/utils/dev-client.js')].concat(webpackBaseConf.entry[name])
})

module.exports = merge(webpackBaseConf, {
  devtool: '#cheap-module-eval-source-map',
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              plugins: [
                require('cssnano')({
                  preset: ['default', {
                    discardComments: false,
                    normalizeWhitespace: false
                  }]
                }),
                require('autoprefixer')({
                  browsers: config.client.browserList
                })
              ]
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"'
      }
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new ProgressBarPlugin({
      summary: false
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: utils.dir('src/client/html/index.html'),
      inject: true
    }),
    new FriendlyErrorsPlugin()
  ]
})

