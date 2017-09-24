const path = require('path')
const chalk = require('chalk')
const babel = require('babel-core')
const fs = require('fs')
const requireFromString = require('require-from-string')

let projectConfigCache = null

exports.dir = (...dirs) => {
  return path.join(__dirname, '../../', ...dirs)
}

exports.env = () => {
  return process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
}

exports.logger = (level, message, extraInfo = null) => {
  let msg = '\n'
  switch (level) {
    case 'success':
      msg += chalk.bgGreen(chalk.black(' SUCCESS '))
      msg += chalk.green(` ${message}`)
      break
    case 'error':
      msg += chalk.bgRed(chalk.black(' ERROR '))
      msg += chalk.red(` ${message}`)
      if (extraInfo) {
        if (extraInfo.stack) {
          msg += '\n\nStack trace:\n\n'
          msg += chalk.red(extraInfo.stack)
        } else {
          msg += '\n\nError info:\n\n'
          msg += String(extraInfo)
        }
      }
      break
    case 'warn':
      msg += chalk.bgYellow(chalk.black(' WARN '))
      msg += chalk.yellow(` ${message}`)
      break
    case 'info':
    default:
      msg += chalk.bgBlue(chalk.black(' INFO '))
      msg += chalk.blue(` ${message}`)
  }
  console.log(msg)
}

exports.es6ToCommonJS = (url) => {
  // Read js file
  let text
  try {
    text = fs.readFileSync(url, 'utf8')
  } catch (e) {
    console.error(e)
    return
  }
  //
  if (!text) {
    return
  }

  const compiled = babel.transform(text, {
    plugins: [['transform-es2015-modules-commonjs', {
      'loose': true
    }]]
  })

  return compiled.code
}

exports.getProjectConfig = () => {
  if (!projectConfigCache) {
    projectConfigCache = requireFromString(
      exports.es6ToCommonJS(exports.dir('config', 'project.js'))
    ).default
  }

  return projectConfigCache
}

// const a = exports.getProjectConfig()

// console.log(a)

// console.log(path.join(process.cwd(), 'config/project.js'))

// const a = exports.es6ToCommonJS(path.join(process.cwd(), 'config/project.js'))
