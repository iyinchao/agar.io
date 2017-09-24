import { throttle } from 'lodash'
import Promise from 'bluebird'
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

let mX = 0
let mY = 0

let leaderBoardTimer = 0

const deleteOp = (obj) => {
  delete obj.op
  return obj
}

const States = {
  idle: {
    preload () {
      this.g = this.game
    }
  },
  game: {
    preload () {
      this.g = this.game

      this.g.stage.disableVisibilityChange = true

      this.g.load.image('background', require('@/assets/img/tile.png'))

      this.g.$ws.on('connect', () => {
        console.log('[ws] Connected!')
        setTimeout(() => {
          this.g.$ws.emit('join', {
            nickname: this.g.$info.myName
          })
        }, 1000)
      })

      this.g.$ws.on('joined', (e) => {
        console.log('[ws] You are joined!', e)
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
            if (obj.t !== 1 && obj.t !== 2) {
              console.log(obj)
            }
            switch (obj.t) {
              case 2:
                // food
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
        this.g.$overlay.setState('gaming')
      })

      this.g.$ws.on('scene-diff', (e) => {
        // console.log('[ws] Received scene diff...', e)
        if (e && e.length) {
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
                let p
                switch (diff.op) {
                  case 1:
                    this.g.addCharacter('player', deleteOp(diff))
                    break
                  case 0:
                    // Sync data
                    p = this.g.getCharacter('player', diff.id)
                    const props = Object.keys(deleteOp(diff))
                    props.forEach((prop) => {
                      p[prop] = diff[prop]
                    })
                    break
                  case -1:
                    if (diff.id === this.g.$info.myId) {
                      // Die logic
                      this.g.$overlay.setState('died')
                    }
                    p = this.g.removeCharacter('player', diff.id)
                    p.destroy()
                    p = null
                    break
                }
                break
            }
          })
          // delete
          // ids.forEach((id) => {
          //   this.g.removeCharacter('player', id)
          // })
        }
      })
    },
    create () {
      this.g.scale.setResizeCallback(Callbacks.resize, this)
      this.g.input.mouse.onMouseMove = Callbacks.mouseMove
      this.g.input.keyboard.onUpCallback = Callbacks.keyboardUp
      this.g.input.keyboard.onDownCallback = Callbacks.keyboardDown
      this.g.input.keyboard.onPressCallback = Callbacks.keyboardPress

      this.g.$key = {}
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


      // this.game.addCharacter('player', p)

      // this.game.addCharacter('player', {
      //   id: '1',
      //   r: gameConfig.player.initialValue,
      //   position: { x: this.game.world.width / 2, y: this.game.world.height / 2 },
      //   name: 'charles'
      // })

      Callbacks.resize.call(this, this.scale)

      this.g.$ws.connect()
      this.g.$overlay.setState('joining')
    },
    update () {
      this.g.$graphics.clear()

      this.g.$renderList = []

      let player
      player = this.g.getCharacter('player', this.g.$info.myId)

      // Set cam
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
        if (process.env.NODE_ENV === 'development') {
          this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
          this.game.$graphics.drawRect(playerBound.left, playerBound.top, (playerBound.right - playerBound.left), (playerBound.bottom - playerBound.top))

          this.g.$graphics.lineStyle(2, 0xd75cf6, 1)
          this.g.$graphics.moveTo(player.x, player.y)
          this.g.$graphics.lineTo(mX, mY)
          this.g.$graphics.lineStyle(0, 0x000000, 0)
        }

        this.g.camera.x = (playerBound.right + playerBound.left - this.g.scale.width) / 2
        this.g.camera.y = (playerBound.top + playerBound.bottom - this.g.scale.height) / 2
        // this.g.camera.scale.setTo(2, 2)
      }

      if (process.env.NODE_ENV === 'development') {
        const rect = this.game.getViewRect()
        this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
        this.game.$graphics.drawRect(rect.left, rect.top, (rect.right - rect.left), (rect.bottom - rect.top))
        this.game.$graphics.lineStyle(0, 0x000000, 0)
      }




      // this.game.camera.x = camX
      // this.game.camera.y = camY
      this.g.$viewRect = this.g.getViewRect()

      this.g.cullScene()
      this.g.$renderList.forEach((item) => {
        item.update()
      })

      // Update leaderBoard
      if (leaderBoardTimer > 40) {
        // Generate leader info
        const ids = Array.from(this.g.$playerList.keys())
        ids.sort((a, b) => {
          const wa = this.g.$playerList.get(a).weight
          const wb = this.g.$playerList.get(b).weight
          if (wa > wb) {
            return -1
          }
          if (wa < wb) {
            return 1
          }
          return 0
        })

        const rankIds = ids.slice(0, 5)
        const rankData = rankIds.map((id, index) => {
          return {
            id,
            rank: index + 1,
            name: this.g.$playerList.get(id).name,
            weight: this.g.$playerList.get(id).weight
          }
        })

        if (player && rankIds.indexOf(this.g.$info.myId) === -1) {
          rankData.push({
            id: this.g.$info.myId,
            rank: ids.indexOf(this.g.$info.myId) + 1,
            name: player.name,
            weight: player.weight
          })
        }

        // Update leaderboard
        this.g.$overlay.setLeaderBoard(rankData)

        leaderBoardTimer = -1
      }
      leaderBoardTimer++

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

      // if (a < 200) {
      //   a += 0.5
      // }
      // const player = this.game.getCharacter('player', '1')
      // player.r = a
      // player.position.x += Math.round(ax * 6)
      // player.position.y += Math.round(ay * 6)

      // update speeds
      const delta = 0.1
      if (this.g.$key) {
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
          // console.log('send!', vX, vY)
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
      }
    },
    render () {
      if (process.env.NODE_ENV === 'development') {
        this.game.debug.cameraInfo(this.game.camera, 32, 64)
        this.game.debug.text(`Render objects number: ${this.g.$renderList.length}`, 32, 200, '#000')
        this.game.debug.pointer(this.game.input.activePointer)
      }
    },
    shutdown () {
      this.g.$ws.renew()

      // Clear up data
      this.g.$graphics.clear()
      this.$viewRect = null
      this.g.$renderList = []
      this.g.$playerList.clear()
      this.g.$foodList.clear()

      this.g.$sprites['background'].destroy()
      this.g.$graphics.destroy()

      this.g.input.keyboard.removeKey(Phaser.Keyboard.UP)
      this.g.input.keyboard.removeKey(Phaser.Keyboard.DOWN)
      this.g.input.keyboard.removeKey(Phaser.Keyboard.LEFT)
      this.g.input.keyboard.removeKey(Phaser.Keyboard.RIGHT)
      this.g.$key = null
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
    mX = e.clientX + this.game.camera.x
    mY = e.clientY + this.game.camera.y

    // Get current player
    const p = this.game.getCharacter('player', this.game.$info.myId)
    if (p) {
      let vecX = mX - p.x
      let vecY = mY - p.y
      // Normalize vector
      let nX = vecX / this.game.scale.width * 2
      let nY = vecY / this.game.scale.height * 2

      let maxRatio = Math.max(Math.abs(nX), Math.abs(nY))

      // Bound to 1
      if (maxRatio > 1) {
        nX = nX / maxRatio
        nY = nY / maxRatio
      }

      // if (nX > 1) {
      //   nX = 1
      // }
      // if (nX < -1) {
      //   nX = -1
      // }
      // if (nY > 1) {
      //   nY = 1
      // }
      // if (nY < -1) {
      //   nY = -1
      // }
      // console.log('send!', nX, nY)
      this.game.$ws.emit('op', {
        t: 'mv',
        x: nX,
        y: nY,
        userID: this.game.$info.userId,
        gameID: this.game.$info.gameId
      })
    }
  },
  keyboardPress (e, f) {

  },
  keyboardDown (e) {
    // console.log('down', e)
  },
  keyboardUp (e) {
    switch (e.code) {
      case 'Space':
        this.game.$ws.emit('op', {
          t: 'space',
          userID: this.game.$info.userId,
          gameID: this.game.$info.gameId
        })
        break
      case 'keyW':
        this.game.$ws.emit('op', {
          t: 'w',
          userID: this.game.$info.userId,
          gameID: this.game.$info.gameId
        })
        break
    }
  }
}

class Game extends Phaser.Game {
  constructor (options) {
    const canvas = document.querySelector('#canvas-wrapper')
    super(800, 600, Phaser.CANVAS, canvas, null, true, true)

    this.$canvas = canvas
    this.$states = States
    this.$callbacks = Callbacks
    this.$key = null

    this.$ws = options.ws

    this.$viewRect = null
    this.$sprites = {}
    this.$playerList = new Map()
    this.$foodList = new Map()
    this.$virusList = new Map()
    this.$massFoodList = new Map()
    this.$renderList = []
    this.$info = {}

    this.state.add('game', States.game)
    this.state.add('idle', States.idle)
  }
  reborn () {
    return new Promise((resolve, reject) => {
      if (this.state.current === 'game') {
        // Exit game
        this.$ws.on('exited', () => {
          resolve()
        })

        this.$ws.emit('exit', {
          userID: this.$info.myId,
          gameID: this.$info.gameId
        })
      } else {
        reject(new Error('not-in-game'))
      }
    }).then(() => {
      this.state.start('idle')
      this.$overlay.setState('reborning')
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 1000)
      })
    }).then(() => {
      this.state.start('game')
    })
  }
  drawCircle (x, y, r, edges) {
    // Generate polygon points
    let polygonPoints = []

    // LoD edges
    if (!edges) {
      edges = Math.round(r / 2)
      if (edges < 24) {
        edges = 24
      }
    }

    for (let i = 0; i <= edges; i++) {
      let angle = Math.PI / 180 * (360 / edges) * i
      polygonPoints.push(x + Math.cos(angle) * r)
      polygonPoints.push(y + Math.sin(angle) * r)
    }
    this.$graphics.drawShape(new Pixi.Polygon(polygonPoints))
    // this.$graphics.drawShape(new Phaser.Circle(x, y, 10 * r))
  }
  drawVirus (x, y, r) {
    let polygonPoints = []
    let edges = Math.round(r / 1.5) % 2 ? Math.round(r / 1.5) + 1 : Math.round(r / 1.5)
    if (edges < 36) {
      edges = 36
    }
    for (let i = 0; i <= edges; i++) {
      let rr = i % 2 ? r : r * 0.9
      let angle = Math.PI / 180 * (360 / edges) * i
      polygonPoints.push(x + Math.cos(angle) * rr)
      polygonPoints.push(y + Math.sin(angle) * rr)
    }
    this.$graphics.drawShape(new Pixi.Polygon(polygonPoints))
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
    // TODO: sorting characters
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
    if (!this.$viewRect) {
      return false
    }
    const rect = this.$viewRect
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
