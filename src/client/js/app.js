import '@/styles/app.scss'

import Game from '@/js/game'
import WS from '@/js/ws'
//
import Overlay from '@/js/overlay'

const ws = new WS()
const game = new Game({
  ws
})
const overlay = new Overlay({
  ws
})

overlay.game = game
game.$overlay = overlay

// Init pahser globals
window.PhaserGlobal = {}

if (process.env.NODE_ENV === 'production') {
  window.PhaserGlobal.hideBanner = true
} else if (process.env.NODE_ENV === 'development') {
  window.PhaserGlobal.hideBanner = false
}

// ws.socket.on('connect', (e) => {
//   console.log('connected')
//   ws.socket.emit('playerlogin', {
//     'screenWidth': 1200,
//     'screenHeight': 1000,
//     'name': 'charles' + Date.now().toString().slice(0, 5),
//     // Mouse position on screen
//     'target': {
//       'x': 300,
//       'y': 300
//     }
//   })
// })

// ws.socket.on('serverTellPlayerMove', (e) => {
//   console.log(e)
// })

// console.log(process.env.NODE_ENV)

// NOTE: For debug purpose. You can remove it without any side-effects.
if (process.env.NODE_ENV === 'development') {
  window.$game = game
  window.$overlay = overlay
}

// class Game extends Phaser.Game {
//   constructor (container, states = null) {
//     super(
//       800, 600,
//       Phaser.AUTO,
//       container,
//       states,
//       true, true
//     )
//   }
// }

// const game = new Game(document.querySelector('#canvas-wrapper'), {
//   init () {
//     console.log('called')
//     window.addEventListener('resize', (e) => {
//       this.scale.setGameSize(this.game.parent.clientWidth, this.game.parent.clientHeight)
//       console.log(this)
//     })
//   },
//   preload () {
//     this.load.image('background', require('@/assets/img/tile.png'))
//   },
//   create () {
//     // console.log(this.game.parent.clientWidth);
//     this.scale.setGameSize(this.game.parent.clientWidth, this.game.parent.clientHeight)
//     this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT
//     this.game.world.setBounds(
//       1, 0,
//       gameConfig.world.width,
//       gameConfig.world.height)
//     this.game.add.tileSprite(
//       0, 0,
//       gameConfig.world.width,
//       gameConfig.world.height,
//       'background')

//       var graphics = this.game.add.graphics(0, 0);

//           graphics.lineStyle(10, 0xffd900, 1);

//           graphics.beginFill(0xFF0000, 1);
//           graphics.drawCircle(1200, 1200, 100);

//               //
//     // console.log(this.game.width, this.game.height)
//     // var background = this.add.tileSprite(-width, -height,
//     //   this.game.world.width, this.game.world.height, 'background');
//   },
//   update () {
//     // this.camera.width = this.game.width
//     // this.camera.height = this.game.height
//     // this.camera.bounds.x = this.game.width
//     this.camera.x = 1200 - this.camera.width / 2
//     this.camera.y = 1200 - this.camera.height / 2
//   },
//   render () {
//     this.game.debug.cameraInfo(this.game.camera, 500, 32)
//     this.game.debug.inputInfo(32, 32)
//   },
//   onGameResize () {

//   }
// })

// const overlay = new Overlay()
