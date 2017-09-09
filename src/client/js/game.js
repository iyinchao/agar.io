import { throttle } from 'lodash'
/* eslint-disable no-unused-vars */
import Pixi from 'pixi'
import P2 from 'p2'
import Phaser from 'phaser'
/* eslint-enable no-unused-vars */
import gameConfig from '~/config/game'
import { Player, Food, Virus } from '@/js/characters'

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
      // this.game.input.keyboard.onDownCallback(Callbacks.keyboardDown, this)
      // this.game.keyboard.addMoveCallback(this,
      //   Callbacks.keyboardDown,
      //   Callbacks.keyboardUp,
      //   Callbacks.keyboardPress)

      this.game.world.setBounds(0, 0, gameConfig.world.width, gameConfig.world.height)

      this.game.$sprites['background'] = this.add.tileSprite(
        0, 0, gameConfig.world.width, gameConfig.world.height,
        'background')
      this.game.$graphics = this.game.add.graphics(0, 0)

      for (let i = 0; i < 200; i++) {
        this.game.addCharacter('food', {
          id: i,
          value: 1,
          position: {
            x: Math.random() * this.game.world.width,
            y: Math.random() * this.game.world.height
          }
        })
      }

      this.game.addCharacter('player', {
        id: '1',
        value: gameConfig.player.initialValue,
        position: { x: this.game.world.width / 2, y: this.game.world.height / 2 },
        name: 'charles'
      })

      Callbacks.resize.call(this, this.scale)
    },
    update () {
      this.game.$graphics.clear()

      if (a < 200) {
        a += 0.5
      }
      const player = this.game.getCharacter('player', '1')
      player.value = a
      player.position.x += Math.round(ax * 6)
      player.position.y += Math.round(ay * 6)

      this.game.$foodList.forEach((food) => {
        food.update()
      })

      this.game.$playerList.forEach((player) => {
        player.update()
      })

      this.game.camera.x = player.position.x - this.game.scale.width / 2
      this.game.camera.y = player.position.y - this.game.scale.height / 2
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
  },
  keyboardPress (e) {
    console.log('press', e)
  },
  keyboardDown (e) {
    console.log('down', e)
  },
  keyboardUp (e) {
    console.log('up', e)
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

    const defaultOption = {
      game: this
    }

    let list
    let Obj
    switch (type) {
      case 'player':
      case 'virus':
      case 'food':
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
        list.set(option.id, new Obj(Object.assign({}, defaultOption, option)))
        break
      default:
        console.warn('@addCharacter:', `Invalid character type ${type}`)
    }
  }
  getCharacter (type, id) {
    if (id === undefined) {
      return
    }

    let list
    switch (type) {
      case 'player':
        list = this.$playerList
        break
      case 'food':
        list = this.$foodList
        break
      case 'virus':
        list = this.$virusList
        break
      default:
        console.warn('@removeCharacter', `Invalid character tyle ${type}`)
    }
    if (!list.has(id)) {
      console.warn('@removeCharacter', `ID ${id} not exists for ${type}`)
      return
    }

    return list.get(id)
  }
  removeCharacter (type, id) {
    if (id === undefined) {
      return
    }

    let list
    switch (type) {
      case 'player':
        list = this.$playerList
        break
      case 'food':
        list = this.$foodList
        break
      case 'virus':
        list = this.$virusList
        break
      default:
        console.warn('@removeCharacter', `Invalid character tyle ${type}`)
    }
    if (!list.has(id)) {
      console.warn('@removeCharacter', `ID ${id} not exists for ${type}`)
      return
    }

    let Obj = list.get(id)
    list.delete(id)

    return Obj
  }
}

export default Game
