const path = require('path')
const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const config = require(path.join(baseURL, 'config/project'))

const phaserDir = utils.dir('node_modules/phaser')
// phaser: path.join(PHASER_DIR, 'build/custom/phaser-split.js'),
// pixi: path.join(PHASER_DIR, 'build/custom/pixi.js'),
// p2: path.join(PHASER_DIR, 'build/custom/p2.js'),

module.exports = {
  context: utils.dir(),
  entry: {
    app: utils.dir('src/client/js/app.js')
  },
  output: {
    filename: `${config.assetsSubDirectory}/js/[name].[hash:7].js`,
    path: utils.dir(`${config.dist}/${config.client.dir}`),
    publicPath: config.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': utils.dir('src/client'),
      '~': utils.dir('src'),
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
        include: [utils.dir('src/client')],
      },
      { test: /pixi\.js/, loader: 'expose-loader', options: 'PIXI' },
      { test: /phaser-split\.js$/, loader: 'expose-loader', options: 'Phaser' },
      { test: /p2\.js/, loader: 'expose-loader', options: 'p2' },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/img')],
        options: {
          limit: 10000,
          name: path.join(`${config.dist}
          /${config.client.dir}
          /${config.assetsSubDirectory}/img/[name].[hash:7].[ext]`)
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/audio')],
        options: {
          limit: 10000,
          name: path.join(`${config.dist}
          /${config.client.dir}
          /${config.assetsSubDirectory}/media/[name].[hash:7].[ext]`)
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/font')],
        options: {
          limit: 10000,
          name: path.join(`${config.dist}
          /${config.client.dir}
          /${config.assetsSubDirectory}/font/[name].[hash:7].[ext]`)
        }
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              plugins: [
                require('cssnano')(),
                require('autoprefixer')({
                  browsers: ["> 1%", "last 2 versions", "not ie <= 8"]
                })
              ]
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
  }
}
