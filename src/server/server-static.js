/**
* @file overview
* @desc desc
* @author Charlieyin <charlieyin@tencent.com>
*/

var path = require('path')

var express = require('express')
var app = express()

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../../dist/client/index.html'))
})

app.use('/static', express.static(path.join(__dirname, '../../dist/client/static')))

app.listen(80, function () {
  console.log('Static server now running at port 80 !')
})
