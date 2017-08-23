const path = require('path')
const baseURL = process.cwd()
const utils = require(path.join(baseURL, 'scripts/utils'))
const config = require(path.join(baseURL, 'config/project'))

module.exports = {
  context: utils.dir(),
  entry: {
    app: utils.dir('src/client/js/app.js')
  },
  output: {
    filename: 'js/[name].[hash:7].js',
    path: utils.dir(config.dist),
    publicPath: config.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': utils.dir('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [utils.dir('src/client')],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/img')],
        options: {
          limit: 10000,
          name: path.join(config.dist, config.assetsSubDirectory, 'img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/audio')],
        options: {
          limit: 10000,
          name: path.join(config.dist, config.assetsSubDirectory, 'media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        include: [utils.dir('src/client/assets/font')],
        options: {
          limit: 10000,
          name: path.join(config.dist, config.assetsSubDirectory, 'fonts/[name].[hash:7].[ext]')
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
