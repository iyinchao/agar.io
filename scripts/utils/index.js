const path = require('path')

exports.dir = (...dirs) => {
  return path.join(__dirname, '..', ...dirs)
}

exports.env = () => {
  return process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
}
