import '~/client/styles/app.scss'
import '@/js/test'
import Pixi from 'pixi'
import P2 from 'p2'
import Phaser from 'phaser'
// console.log(require('phaser/build/custom/pixi'))
// window.p2 = require('phaser/build/custom/p2')
// window.Phaser = require('phaser/build/custom/phaser-split')
//document.body.appendChild(`<div id="app">It works! ${Date.now()}</div>`)
let game = new Phaser.Game(800, 600, Phaser.AUTO, document.querySelector('#canvas-wrapper'))
