const path = require('path')
const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const config = utils.getProjectConfig()

const phaserDir = utils.dir('node_modules/phaser-ce')
const assetSubDir = config.client.assetDir

module.exports = {
  context: utils.dir(),
  entry: {
    app: utils.dir('src/client/js/app.js')
  },
  output: {
    filename: `${config.client.assetDir}/js/[name].[hash:7].js`,
    path: utils.dir(`${config.dist}/${config.client.dir}`),
    publicPath: config.client.assetPublicPath
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': utils.dir('src/client'),
      '~': utils.dir(),
      // For phaser 2, to use with webpack, components must be import explicitly
      // See: https://github.com/photonstorm/phaser/issues/2762
      phaser: path.join(phaserDir, 'build/custom/phaser-split.js'),
      pixi: path.join(phaserDir, 'build/custom/pixi.js'),
      p2: path.join(phaserDir, 'build/custom/p2.js'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          utils.dir('src/client'),
          utils.dir('config')
        ],
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        include: [utils.dir('src/client/html')]
      },
      // For phaser 2, these components must be avaliable in global scope.
      // See: https://github.com/photonstorm/phaser/issues/2762
      { test: /pixi\.js/, loader: 'expose-loader', include: [phaserDir], options: 'PIXI' },
      { test: /phaser-split\.js$/, loader: 'expose-loader', include: [phaserDir], options: 'Phaser' },
      { test: /p2\.js/, loader: 'expose-loader', include: [phaserDir], options: 'p2' },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/img')],
        options: {
          limit: 10000,
          name: `${assetSubDir}/img/[name].[hash:7].[ext]`
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/audio')],
        options: {
          limit: 10000,
          name: `${assetSubDir}/media/[name].[hash:7].[ext]`
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/font')],
        options: {
          limit: 10000,
          name: `${assetSubDir}/font/[name].[hash:7].[ext]`
        }
      }
    ]
  }
}
