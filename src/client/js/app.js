import '~/client/styles/app.scss'
import '@/js/test'
import Phaser from 'phaser'
// console.log(require('phaser/build/custom/pixi'))
// window.p2 = require('phaser/build/custom/p2')
// window.Phaser = require('phaser/build/custom/phaser-split')
// document.write(`<div id="app">It works! ${Date.now()}</div>`)
let game = new Phaser.Game(800, 600, Phaser.AUTO, document.querySelector('#canvas-wrapper'))
