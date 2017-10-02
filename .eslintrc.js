const config = {
  root: true,
  parser: 'babel-eslint',
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: 'standard',
  plugins: [ 'html', 'import' ],
  rules: {}
}

module.exports = config
