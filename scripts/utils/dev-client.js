require('eventsource-polyfill')
require('webpack-hot-middleware/client?noInfo=true&reload=true')

if (module.hot) {
  module.hot.accept()
}
