const path = require('path')
const chalk = require('chalk')

exports.dir = (...dirs) => {
  return path.join(__dirname, '../../', ...dirs)
}

exports.env = () => {
  return process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
}

exports.logger = (level, message, extraInfo = null) => {
  let msg = ''
  switch (level) {
    case 'success':
      msg += chalk.bgGreen(chalk.black(' SUCCESS '))
      msg += chalk.green(` ${message}\n`)
      break
    case 'error':
      msg += chalk.bgRed(chalk.black(' ERROR '))
      msg += chalk.red(` ${message}\n`)
      if (extraInfo) {
        if (extraInfo.stack) {
          msg += '\nStack trace:\n'
          msg += chalk.red(extraInfo.stack) + '\n'
        }
      } else {
        msg += '\nError info:\n'
        msg += String(extraInfo) + '\n'
      }
      break
    case 'warn':
      msg += chalk.bgYellow(chalk.black(' WARN '))
      msg += chalk.yellow(` ${message}\n`)
      break
    case 'info':
    default:
      msg += chalk.bgBlue(chalk.black(' INFO '))
      msg += chalk.blue(` ${message}\n`)
  }
  console.log(msg)
}
