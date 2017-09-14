import { throttle } from 'lodash'
/* eslint-disable no-unused-vars */
import Pixi from 'pixi'
import P2 from 'p2'
import Phaser from 'phaser'
/* eslint-enable no-unused-vars */
import gameConfig from '~/config/game'
import { Player, Food, Virus } from '@/js/characters'

let vX = 0
let vY = 0
let lvX = 0
let lvY = 0

const States = {
  game: {
    preload () {
      this.g = this.game
      this.load.image('background', require('@/assets/img/tile.png'))

      this.g.$ws.on('connect', () => {
        console.log('[ws] Connected!')
        this.g.$ws.emit('join', {
          nickname: this.g.$myPlayerName
        })
      })

      this.g.$ws.on('joined', (e) => {
        console.log('[ws] You are joined!', e)
        this.g.$info = {}
        this.g.$info.gameId = e.gameID
        this.g.$info.userId = e.userID
      })

      this.g.$ws.on('scene-setup', (e) => {
        console.log('[ws] Scene is now setting up.')

        this.g.$info.myId = e.playerMainId
        this.g.$playerList.clear()
        this.g.$foodList.clear()
        if (e.setup && e.setup.length) {
          e.setup.forEach((obj) => {
            switch (obj.t) {
              case 2:
                //food
                this.g.addCharacter('food', {
                  id: obj.id,
                  hue: obj.hue,
                  r: obj.r,
                  x: obj.x,
                  y: obj.y
                })
                break
              case 1:
                // player
                this.g.addCharacter('player', obj)
            }
          })
        }

        this.g.$overlay.hide(this.g.$overlay.refs.mask)
      })

      this.g.$ws.on('scene-diff', (e) => {
        // console.log('[ws] Received scene diff...', e)
        console.log(e)
        if (e && e.length) {
          const ids = Array.from(this.g.$playerList.keys())
          console.log(ids)
          e.forEach((diff) => {
            switch (diff.t) {
              case 2:
                // food
                switch (diff.op) {
                  case 1:
                    // add
                    this.g.addCharacter('food', {
                      id: diff.id,
                      hue: diff.hue,
                      r: diff.r,
                      x: diff.x,
                      y: diff.y
                    })
                    break
                  case -1:
                    // remove
                    this.g.removeCharacter('food', diff.id)
                    break
                }
                break
              case 1:
                // player
                // do diff here... fuck this shit.
                const idx = ids.indexOf(diff.id)
                if (idx > -1) {
                  const p = this.g.getCharacter('player', diff.id)
                  // console.log(diff.id, ids, diff, p)
                  this.g.syncPlayeProps(
                    p,
                    diff
                  )
                  // remove updated id
                  ids.splice(idx, 1)
                } else {
                  this.g.addCharacter('player', diff)
                }
                break
            }
          })
          // delete
          ids.forEach((id) => {
            this.g.removeCharacter('player', id)
          })
        }
      })

      this.g.$ws.on('exited', (e) => {

      })
    },
    create () {
      this.g.scale.setResizeCallback(Callbacks.resize, this)
      this.g.input.mouse.onMouseMove = Callbacks.mouseMove
      this.g.input.keyboard.onUpCallback = Callbacks.keyboardUp
      this.g.input.keyboard.onDownCallback = Callbacks.keyboardDown
      this.g.input.keyboard.onPressCallback = Callbacks.keyboardPress
      this.g.$key.up = this.g.input.keyboard.addKey(Phaser.Keyboard.UP)
      this.g.$key.down = this.g.input.keyboard.addKey(Phaser.Keyboard.DOWN)
      this.g.$key.left = this.g.input.keyboard.addKey(Phaser.Keyboard.LEFT)
      this.g.$key.right = this.g.input.keyboard.addKey(Phaser.Keyboard.RIGHT)

      this.g.world.setBounds(0, 0, gameConfig.world.width, gameConfig.world.height)
      this.g.$sprites['background'] = this.add.tileSprite(
        0, 0, gameConfig.world.width, gameConfig.world.height,
        'background')

      this.g.$graphics = this.g.add.graphics(0, 0)

      // NOTE:
      // for (let i = 0; i < 1000; i++) {
      //   this.game.addCharacter('food', {
      //     id: i,
      //     r: 10,
      //     x: Math.random() * this.game.world.width,
      //     y: Math.random() * this.game.world.height,
      //     hue: parseInt(Math.random() * 360)
      //   })
      // }

      // const p = {
      //   id: 0,
      //   r: 200,
      //   hue: parseInt(Math.random() * 360),
      //   x: 1000,
      //   y: 500,
      //   name: 'Charles',
      //   cells: []
      // }

      // for (let i = 0; i < 16; i++) {
      //   p.cells.push({
      //     x: p.x + 500 * (Math.random() - 0.5),
      //     y: p.y + 500 * (Math.random() - 0.5),
      //     r: 50 + 50 * Math.random()
      //   })
      // }

      // this.g.$myPlayerId = 0

      // this.game.addCharacter('player', p)

      // this.game.addCharacter('player', {
      //   id: '1',
      //   r: gameConfig.player.initialValue,
      //   position: { x: this.game.world.width / 2, y: this.game.world.height / 2 },
      //   name: 'charles'
      // })

      Callbacks.resize.call(this, this.scale)

      // //

      // this.game.$ws.socket.on('gameSetup', (e) => {
      //   e.allFood.forEach((food) => {
      //     this.game.addCharacter('food', food)
      //   })
      //   e.allPlayers.forEach((player, index) => {
      //     if (index === 0) {
      //       this.game.addCharacter('player', player)
      //       this.game.$myPlayerId = player.id
      //     }
      //   })

      //   this.game.$overlay.hide(this.game.$overlay.refs.panelGame)
      //   this.game.$overlay.hide(this.game.$overlay.refs.mask)
      //   // this.game.$myPlayer = e.id
      // })

      // this.game.$ws.socket.on('connect', () => {
      //   console.log('connected')
      //   this.game.$ws.socket.emit('playerlogin', {
      //     'screenWidth': this.game.scale.width,
      //     'screenHeight': this.game.scale.height,
      //     'name': this.game.$myPlayerName,
      //     // Mouse position on screen
      //     'target': {
      //       'x': 0,
      //       'y': 0
      //     }
      //   })
      // })

      // this.game.$ws.socket.on('serverTellPlayerMove', (e) => {
      //   const player = this.game.getCharacter('player', this.game.$myPlayerId)

      //   e.visibleCells.forEach((p, index) => {
      //     if (index === 0) {
      //       player.x = p.x
      //       player.y = p.y
      //       p.cells.forEach((cell, index) => {
      //         player.cells[index].x = cell.x
      //         player.cells[index].y = cell.y
      //         player.cells[index].radius = cell.radius
      //       })
      //     }
      //   })
      // })

      this.g.$ws.connect()

      //this.game.$myPlayerId = 1
      // this.game.addCharacter('player', {
      //   id: this.game.$myPlayerId,
      //   name: this.game.$myPlayerName,
      //   x: 500,
      //   y: 500,
      //   cells: [
      //     {
      //       radius: 100,
      //       x: 500,
      //       y: 500
      //     },
      //     {
      //       radius: 300,
      //       x: 800,
      //       y: 500
      //     }
      //   ],
      //   hue: Math.random() * 360
      // })
    },
    update () {
      this.g.$graphics.clear()

      this.g.$renderList = []

      // let camX = 0
      // let camY = 0

      // if (this.game.$myPlayerId) {
      //   const player = this.game.getCharacter('player', this.game.$myPlayerId)

      //   camX = player.x - this.game.scale.width / 2
      //   camY = player.y - this.game.scale.height / 2
      // }

      // Set cam

      let player
      if (this.g.$info.myId !== undefined) {
        player = this.g.getCharacter('player', this.g.$info.myId)
      }

      if (player && player.cells && player.cells.length) {
        let playerBound
        player.cells.forEach((cell) => {
          if (!playerBound) {
            playerBound = {
              top: cell.y - cell.r,
              left: cell.x - cell.r,
              right: cell.x + cell.r,
              bottom: cell.y + cell.r
            }
            return
          }
          let top = cell.y - cell.r
          let left = cell.x - cell.r
          let right = cell.x + cell.r
          let bottom = cell.y + cell.r
          playerBound.top = Math.min(playerBound.top, top)
          playerBound.left = Math.min(playerBound.left, left)
          playerBound.right = Math.max(playerBound.right, right)
          playerBound.bottom = Math.max(playerBound.bottom, bottom)
        })
        this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
        this.game.$graphics.drawRect(playerBound.left, playerBound.top, (playerBound.right - playerBound.left), (playerBound.bottom - playerBound.top))
        this.game.$graphics.lineStyle(0, 0x000000, 0)
        this.g.camera.x = (playerBound.right + playerBound.left - this.g.scale.width) / 2
        this.g.camera.y = (playerBound.top + playerBound.bottom - this.g.scale.height) / 2

        // this.g.camera.scale.setTo(2, 2)
      }

      const rect = this.game.getViewRect()
      this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
      this.game.$graphics.drawRect(rect.left, rect.top, (rect.right - rect.left), (rect.bottom - rect.top))
      this.game.$graphics.lineStyle(0, 0x000000, 0)


      // this.game.camera.x = camX
      // this.game.camera.y = camY

      this.game.cullScene()

      // this.game.foodList.forEach((food) => {
      //   this.game.drawFood(food)
      // })

      // this.game.playerList.forEach((player) => {
      //   if (player.id === this.game.me.id) {
      //     this.game.me = player
      //   }
      //   let cell = player.cells[0]
      //   this.game.$graphics.beginFill(0xa92cc8, 1)
      //   this.game.drawCircle(this.game.scale.width / 2, this.game.scale.height / 2, cell.radius, 40)
      //   this.game.$graphics.endFill()
      // })
////////////////////////////////
      // if (a < 200) {
      //   a += 0.5
      // }
      // const player = this.game.getCharacter('player', '1')
      // player.r = a
      // player.position.x += Math.round(ax * 6)
      // player.position.y += Math.round(ay * 6)

      this.g.$renderList.forEach((item) => {
        item.update()
      })

      // update speeds
      const delta = 0.1
      if (this.g.$key.down.isDown) {
        vY += delta
      }
      if (this.g.$key.up.isDown) {
        vY -= delta
      }
      if (this.g.$key.right.isDown) {
        vX += delta
      }
      if (this.g.$key.left.isDown) {
        vX -= delta
      }
      vX = Math.round(vX * 100) / 100
      vY = Math.round(vY * 100) / 100
      // Normalize speed
      if (vX > 1) {
        vX = 1
      }
      if (vX < -1) {
        vX = -1
      }
      if (vY > 1) {
        vY = 1
      }
      if (vY < -1) {
        vY = -1
      }
      if (vX !== lvX || vY !== lvY) {
        console.log('send!', vX, vY)
        this.g.$ws.emit('op', {
          t: 'mv',
          x: vX,
          y: vY,
          userID: this.g.$info.userId,
          gameID: this.g.$info.gameId
        })
      }
      lvX = vX
      lvY = vY
      // this.game.$playerList.forEach((player) => {
      //   player.update()
      // })

      // this.game.getViewRect()
    },
    render () {
      this.game.debug.cameraInfo(this.game.camera, 32, 64)
      this.game.debug.pointer(this.game.input.activePointer)
      this.game.debug.text(`Render objects number: ${this.g.$renderList.length}`, 32, 200, '#000')
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
    // this.game.$ws.socket.emit('updatetarget', {
    //   x: e.clientX,
    //   y: e.clientY
    // })
    // ax = (e.clientX - (this.game.scale.width / 2)) / this.game.scale.width * 2
    // ay = (e.clientY - (this.game.scale.height / 2)) / this.game.scale.height * 2

    // Get mouse position of world

  },
  keyboardPress (e,f) {

  },
  keyboardDown (e) {
    // console.log('down', e)
  },
  keyboardUp (e) {
    switch (e.code) {
      case 'Space':
        this.game.$ws.emit('op', {
          t: 'space'
        })
        break
      case 'w':
      case 'W':
        this.game.$ws.emit('op', {
          t: 'w'
        })
        break
    }
  }
}

class Game extends Phaser.Game {
  constructor (options) {
    const canvas = document.querySelector('#canvas-wrapper')
    super(800, 600, Phaser.AUTO, canvas, null, true, true)

    this.$canvas = canvas
    this.$states = States
    this.$callbacks = Callbacks
    this.$key = {}

    this.$ws = options.ws

    this.$sprites = {}
    this.$playerList = new Map()
    this.$foodList = new Map()
    this.$virusList = new Map()
    this.$massFoodList = new Map()
    this.$renderList = []
    this.$myPlayerId = null
    this.$info = {}

    this.state.add('game', States.game)
    // this.state.start('game')
  }
  syncPlayeProps (player, diff) {
    player.cells = diff.cells
    player.x = diff.x
    player.y = diff.y
  }
  drawCircle (x, y, r, edges = 40) {
    // Generate polygon points

    let polygonPoints = []
    for (let i = 0; i <= edges; i++) {
      let angle = Math.PI / 180 * (360 / edges) * i
      polygonPoints.push(x + Math.cos(angle) * r)
      polygonPoints.push(y + Math.sin(angle) * r)
    }
    this.$graphics.drawShape(new Pixi.Polygon(polygonPoints))
    // this.$graphics.drawShape(new Phaser.Circle(x, y, 10 * r))
  }
  // drawFood (food) {
  //   this.$graphics.beginFill(
  //     parseInt(TinyColor({h: food.hue, s: 100, v: 100}).toHex(), 16),
  //     1)
  //   this.drawCircle(
  //     food.x - this.me.x + this.scale.width / 2,
  //     food.y - this.me.y + this.scale.height / 2,
  //     food.radius, 6)
  //   this.$graphics.endFill()
  // }
  // drawPlayer (player) {
  //   this.$graphics.beginFill(
  //     parseInt(TinyColor({h: player.hue, s: 100, v: 100}).toHex(), 16),
  //     1)

  //   // this.drawCircle(
  //   //   food.x - this.game.playerList[0].x + this.game.scale.width / 2,
  //   //   food.y - this.game.playerList[0].y + this.game.scale.height / 2,
  //   //   food.radius, 6)
  //   this.$graphics.endFill()
  // }
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
        console.warn('@getCharacter', `Invalid character tyle ${type}`)
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
  cullScene () {
    this.$foodList.forEach((food) => {
      if (this.isInView(food)) {
        this.$renderList.push(food)
      }
    })

    //
    this.$playerList.forEach((player) => {
      if (player.cells && player.cells.length) {
        player.cells.forEach((cell) => {
          if (this.isInView(cell)) {
            this.$renderList.push(cell)
          }
        })
        if (this.isInView(player)) {
          this.$renderList.push(player)
        }
      }
    })
  }
  isInView (character) {
    const rect = this.getViewRect()
    if (character.x - character.r > rect.right ||
    character.x + character.r < rect.left ||
    character.y - character.r > rect.bottom ||
    character.y + character.r < rect.top) {
      return false
    } else {
      return true
    }
  }
  getViewRect () {
    // Current view rect
    const rect = {
      top: (this.camera.y) / this.camera.scale.y,
      left: (this.camera.x) / this.camera.scale.x,
      bottom: (this.camera.y + this.camera.height) / this.camera.scale.y,
      right: (this.camera.x + this.camera.width) / this.camera.scale.x
    }

    return rect
  }
}

export default Game
