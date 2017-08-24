import '@/styles/app.scss'
/* eslint-disable no-unused-vars */
import Pixi from 'pixi'
import P2 from 'p2'
import Phaser from 'phaser'
/* eslint-enable no-unused-vars */
import gameConfig from '~/config/game'

class Game extends Phaser.Game {
  constructor (container, states = null) {
    super(
      800, 600,
      Phaser.AUTO,
      container,
      states,
      true, true
    )
  }
}

const game = new Game(document.querySelector('#canvas-wrapper'), {
  init () {
    console.log('called')
    window.addEventListener('resize', (e) => {
      console.log(e)
    })
  },
  preload () {
    this.load.image('background', require('@/assets/img/tile.png'))
  },
  create () {
    // console.log(this.game.parent.clientWidth);
    this.scale.setGameSize(this.game.parent.clientWidth, this.game.parent.clientHeight)
    this.game.world.setBounds(0, 0, gameConfig.world.width, gameConfig.world.height)
    this.game.add.tileSprite(
      0, 0,
      gameConfig.world.width, gameConfig.world.height,
      'background')
    // this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT
    // console.log(this.game.width, this.game.height)
    // var background = this.add.tileSprite(-width, -height,
    //   this.game.world.width, this.game.world.height, 'background');
  }
})
