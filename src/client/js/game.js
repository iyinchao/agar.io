import { throttle } from 'lodash'
/* eslint-disable no-unused-vars */
import Pixi from 'pixi'
import P2 from 'p2'
import Phaser from 'phaser'
/* eslint-enable no-unused-vars */
import gameConfig from '~/config/game'
import { Player } from '@/js/characters'

let a = 10
let ax = 0
let ay = 0

const States = {
  game: {
    preload () {
      this.load.image('background', require('@/assets/img/tile.png'))
    },
    create () {
      this.game.scale.setResizeCallback(Callbacks.resize, this)
      this.game.input.addMoveCallback(Callbacks.mouseMove, this)

      this.game.world.setBounds(0, 0, gameConfig.world.width, gameConfig.world.height)

      this.game.$sprites['background'] = this.add.tileSprite(
        0, 0, gameConfig.world.width, gameConfig.world.height,
        'background')

      this.game.$playerList.set('1', new Player({
        id: '1',
        value: gameConfig.player.initialValue,
        game: this.game,
        position: { x: this.game.world.width / 2, y: this.game.world.height / 2 },
        name: 'charles'
      }))

      Callbacks.resize.call(this, this.scale)
    },
    update () {
      if (a < 200) {
        a += 0.5
      }
      const player = this.game.$playerList.get('1')
      player.value = a
      player.position.x += Math.round(ax * 6)
      player.position.y += Math.round(ay * 6)
      player.update()

      this.game.camera.x = player.position.x - this.game.scale.width / 2
      this.game.camera.y = player.position.y - this.game.scale.height / 2
      // this.game.$playerList.forEach((player) => {
      //   player.update()
      // })
      // this.game.camera.scale.setTo(3 / Math.sqrt(100 + a), 3 / Math.sqrt(100 + a))
    },
    render () {
      this.game.debug.cameraInfo(this.game.camera, 32, 64)
      this.game.debug.pointer(this.game.input.activePointer)
    }
  }
}

const Callbacks = {
  resize: throttle(function onResize (scale) {
    scale.setGameSize(
      this.game.parent.clientWidth,
      this.game.parent.clientHeight)
  }, 500),
  mouseMove (e) {
    ax = (e.clientX - (this.game.scale.width / 2)) / this.game.scale.width * 2
    ay = (e.clientY - (this.game.scale.height / 2)) / this.game.scale.height * 2
  }
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
    this.$virusList = new Map()

    this.state.add('game', States.game)
    this.state.start('game')
  }
  addCharacter (type, option) {
    if (!option || option.id === undefined) {
      console.warn('@addCharacter:', `Invalid character option: ${option}`)
      return
    }
    switch (type) {
      case 'player':
      case 'virus':
      case 'food':
        let list
        let Obj
        if (type === 'player') {
          list = this.$playerList
          Obj = Player
        } else if (type === 'virus') {
          list = this.$virusList
          Obj = Virus
        } else if (type === 'food') {
          list = this.$foodList
          Obj = Food
        }
        if (list.has(option.id)) {
          console.warn('@addCharacter:', `ID ${option.id} has already exists for ${type}`)
          return
        }
        list.set(option.id, new Obj(option))
        break
      default:
        console.warn('@addCharacter:', `Invalid character type ${type}`)
    }
  }
  removeCharacter (type, option) {

  }
}

export default Game
