/**
 * @desc Webpack production build config
 * @author Charlieyin<charlieyin@tencent.com>
 */
const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')

const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const webpackBaseConf = require('./webpack.base.conf')
const config = utils.getProjectConfig()

module.exports = merge(webpackBaseConf, {
  devtool: '#source-map',
  output: {
    filename: `${config.client.assetDir}/js/[name].[chunkhash:7].js`,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                importLoaders: 2,
                minimize: {
                  discardUnused: false,
                  autoprefixer: false
                }
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                plugins: [
                  require('autoprefixer')({
                    browsers: config.client.browserList
                  })
                ]
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true
              }
            }
          ]
        })
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: true
    }),
    // NOTE: "contenthash" is a internal variable in extractTextPlugin
    new ExtractTextPlugin(`${config.client.assetDir}/style/[name].[contenthash:7].css`),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: utils.dir('src/client/html/index.html'),
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true
      }
    }),
    new ProgressBarPlugin({
      summary: false
    }),
  ]
})
