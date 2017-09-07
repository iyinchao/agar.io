import { throttle } from 'lodash'
/* eslint-disable no-unused-vars */
import Pixi from 'pixi'
import P2 from 'p2'
import Phaser from 'phaser'
/* eslint-enable no-unused-vars */
import gameConfig from '~/config/game'
import { Player } from '@/js/characters'

const States = {
  game: {
    preload () {
      this.load.image('background', require('@/assets/img/tile.png'))
    },
    create () {
      this.scale.setResizeCallback(Callbacks.resize, this)

      this.game.$sprites['background'] = this.add.tileSprite(
        0, 0, gameConfig.world.width, gameConfig.world.height,
        'background')

      this.game.$playerList.set('1', new Player({
        id: '1',
        value: gameConfig.player.initialValue,
        game: this.game
      }))

      console.log(this.game.$playerList.get('1'))

      // this.game.camera.scale.setTo(0.5, 0.5)

      Callbacks.resize.call(this, this.scale)
    },
    update () {
      this.game.$playerList.forEach((player) => {
        player.update()
      })
    }
  }
}

const Callbacks = {
  resize: throttle(function onResize (scale) {
    scale.setGameSize(
      this.game.parent.clientWidth,
      this.game.parent.clientHeight)
  }, 500)
}

class Game extends Phaser.Game {
  constructor (options) {
    const canvas = document.querySelector('#canvas-wrapper')
    super(800, 600, Phaser.AUTO, canvas, null, true, true)

    this.$canvas = canvas
    this.$states = States
    this.$callbacks = Callbacks

    this.$ws = options.ws

    this.$sprites = {}
    this.$playerList = new Map()
    this.$foodList = new Map()

    this.state.add('game', States.game)
    this.state.start('game')

  }
}

export default Game
