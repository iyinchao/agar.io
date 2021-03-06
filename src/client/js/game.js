import { throttle } from 'lodash'
import Promise from 'bluebird'
/* eslint-disable no-unused-vars */
import Pixi from 'pixi'
import P2 from 'p2'
import Phaser from 'phaser'
/* eslint-enable no-unused-vars */
import gameConfig from '~/config/game'
import { Player, Food, Virus, MassFood } from '@/js/characters'
import Smoother from '@/js/smoother'

// const smootherX = new Smoother()
// const smootherY = new Smoother()

let vX = 0
let vY = 0
let lvX = 0
let lvY = 0

let mX = 0
let mY = 0

let preloadIntervalId = -1

const camBoundPlayer = { min: 0.05, max: 0.85 }
const camBoundLimit = { min: 0.65, max: 2 }
// const camPreferredScale = 1.0

const smrGuideLineOpacity = new Smoother({
  method: 'exponential',
  params: { alpha: 0.5 }
})

const smrCamScale = new Smoother({
  method: 'exponential',
  params: { alpha: 0.05 }
})

const smrCamX = new Smoother({
  method: 'exponential',
  params: { alpha: 1 }
})

const smrCamY = new Smoother({
  method: 'exponential',
  params: { alpha: 1 }
})

const deleteOp = (obj) => {
  delete obj.op
  return obj
}

const States = {
  idle: {
    preload () {
      this.g = this.game
    },
    create () {

    }
  },
  game: {
    preload () {
      this.g = this.game

      this.g.stage.disableVisibilityChange = true

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

        // Start heart beat
        if (this.g.$heartbeatTimer !== -1) {
          clearInterval(this.g.$heartbeatTimer)
        }
        this.g.$heartbeatTimer = setInterval(() => {
          // FIXME: temp
          // if (!this.g.$overlay.isBrowserInactive()) {
          //   this.g.$ws.emit('heartbeat', {
          //     gameID: this.g.$info.gameId,
          //     userID: this.g.$info.userId
          //   })
          // }
          if (true) {
            this.g.$ws.emit('heartbeat', {
              gameID: this.g.$info.gameId,
              userID: this.g.$info.userId
            })
          }
        }, 1000)
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
                break
              case 3:
                // Virus
                this.g.addCharacter('virus', obj)
                break
              case 4:
                break
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
                    this.g.addCharacter('food', deleteOp(diff))
                    break
                  case -1:
                    // remove
                    this.g.removeCharacter('food', diff.id)
                    break
                }
                break
              case 1:
                // Player
                let p
                switch (diff.op) {
                  case 1:
                    this.g.addCharacter('player', deleteOp(diff))
                    break
                  case 0:
                    p = this.g.getCharacter('player', diff.id)
                    if (diff.id === this.g.$info.myId) {
                      const diffWeight = diff.weight / 50
                      const pWeight = p.weight / 50
                      if (diffWeight - pWeight === 1) {
                        if (this.g.$sounds['gain'].isDecoded && this.g.$overlay.menuSettings.sfxPlay) {
                          this.g.$sounds['gain'].restart()
                          this.g.$sounds['gain'].play()
                        }
                      } else if (diffWeight - pWeight >= 5) {
                        if (this.g.$sounds['gain'].isDecoded && this.g.$overlay.menuSettings.sfxPlay) {
                          this.g.$sounds['gain-big'].restart()
                          this.g.$sounds['gain-big'].play()
                        }
                      }
                    }
                    // Sync data
                    const props = Object.keys(deleteOp(diff))
                    props.forEach((prop) => {
                      p[prop] = diff[prop]
                    })
                    // if (diff.id === this.g.$info.myId) {
                    //   if (diff.x !== undefined) {
                    //     smootherX.setValue(diff.x)
                    //   }
                    //   if (diff.y !== undefined) {
                    //     smootherY.setValue(diff.y)
                    //   }
                    // }
                    break
                  case -1:
                    if (diff.id === this.g.$info.myId) {
                      // Die logic
                      this.g.$overlay.setState('died')
                      this.g.$sounds['bg'].stop()
                      if (this.g.$overlay.menuSettings.sfxPlay) {
                        this.g.$sounds['died'].play()
                      }
                    }
                    p = this.g.removeCharacter('player', diff.id)
                    if (p) {
                      p.destroy()
                      p = null
                    }
                    break
                }
                break
              case 3:
                // Virus
                switch (diff.op) {
                  case 1:
                    this.g.addCharacter('virus', deleteOp(diff))
                    break
                  case -1:
                    this.g.removeCharacter('virus', diff.id)
                    break
                }
                break
              case 4:
                // MassFood
                console.log(diff)
                switch (diff.op) {
                  case 1:
                    this.g.addCharacter('massFood', deleteOp(diff))
                    break
                  case -1:
                    this.g.removeCharacter('massFood', diff.id)
                    break
                }
                break
            }
          })
        }
      })

      // Preload assets
      if (!this.g.$isAssetsPreloaded) {
        this.g.$overlay.setState('preloading')

        this.g.load.onLoadStart.add(Callbacks.loadStart, this)
        this.g.load.onLoadComplete.add(Callbacks.loadComplete, this)

        this.g.load.image('background', require('@/assets/img/tile.png'))
        this.g.load.audio('bg', require('@/assets/audio/bg.mp3'))
        this.g.load.audio('gain', require('@/assets/audio/gain.mp3'))
        this.g.load.audio('gain-big', require('@/assets/audio/gain-big.mp3'))
        this.g.load.audio('split', require('@/assets/audio/split.mp3'))
        this.g.load.audio('shrink', require('@/assets/audio/shrink.mp3'))
        this.g.load.audio('died', require('@/assets/audio/died.mp3'))
      }
    },
    create () {
      // Init inputs
      this.g.input.keyboard.onUpCallback = Callbacks.keyboardUp
      this.g.input.keyboard.onDownCallback = Callbacks.keyboardDown
      this.g.input.keyboard.onPressCallback = Callbacks.keyboardPress
      this.g.input.addMoveCallback(Callbacks.move, this)
      this.g.$key = {}
      this.g.$key.up = this.g.input.keyboard.addKey(Phaser.Keyboard.UP)
      this.g.$key.down = this.g.input.keyboard.addKey(Phaser.Keyboard.DOWN)
      this.g.$key.left = this.g.input.keyboard.addKey(Phaser.Keyboard.LEFT)
      this.g.$key.right = this.g.input.keyboard.addKey(Phaser.Keyboard.RIGHT)

      // Reset sprites
      this.g.$sprites = {}
      this.g.$sprites['background'] = this.g.add.tileSprite(
        0, 0, gameConfig.world.width, gameConfig.world.height,
        'background')

      this.g.$sounds = {}
      this.g.$sounds['bg'] = this.g.add.audio('bg')
      this.g.$sounds['bg'].loop = true
      this.g.$sounds['bg'].volume = 0.5
      this.g.$sounds['gain'] = this.g.add.audio('gain')
      this.g.$sounds['gain'].volume = 500
      this.g.$sounds['gain-big'] = this.g.add.audio('gain-big')
      this.g.$sounds['gain-big'].volume = 50
      this.g.$sounds['split'] = this.g.add.audio('split')
      this.g.$sounds['shrink'] = this.g.add.audio('shrink')
      this.g.$sounds['died'] = this.g.add.audio('died')
      const soundArray = Object.keys(this.g.$sounds).map((key) => {
        return this.g.$sounds[key]
      })
      this.g.sound.setDecodedCallback(soundArray, function () {
        if (this.g.$overlay.menuSettings.bgmPlay) {
          this.g.$sounds['bg'].play()
        }
      }, this)

      this.g.world.setBounds(0, 0, gameConfig.world.width, gameConfig.world.height)
      this.g.$graphics = this.g.add.graphics(0, 0)

      this.g.scale.setResizeCallback(Callbacks.resize, this)
      this.g.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
      this.g.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL
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
            playerBound.width = playerBound.right - playerBound.left
            playerBound.height = playerBound.bottom - playerBound.top
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
          playerBound.width = playerBound.right - playerBound.left
          playerBound.height = playerBound.bottom - playerBound.top
        })
        if (this.g.$debug) {
          this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
          this.game.$graphics.drawRect(playerBound.left, playerBound.top, (playerBound.right - playerBound.left), (playerBound.bottom - playerBound.top))

          this.g.$graphics.lineStyle(2, 0xd75cf6, 1)
          this.g.$graphics.moveTo(player.x, player.y)
          this.g.$graphics.lineTo(mX, mY)
          this.g.$graphics.lineStyle(0, 0x000000, 0)
        }

        // Set best scale for camera
        const cam = this.g.camera
        // const camPreferredScale = 2 - Math.pow(playerBound.width, 1 / 1.5) / 40
        const camPreferredScale = 1
        // let camPreferredScale = 2
        let scaleX = camPreferredScale
        let scaleY = camPreferredScale
        let scale = camPreferredScale
        // rule 1: Bound player
        // Try to display with preferred scale:
        const ppW = playerBound.width / (cam.width / camPreferredScale)
        const ppH = playerBound.height / (cam.height / camPreferredScale)
        if (ppW > camBoundPlayer.max) {
          scaleX = camBoundPlayer.max * (cam.width / playerBound.width)
        } else if (ppW < camBoundPlayer.min) {
          scaleX = camBoundPlayer.min * (cam.width / playerBound.width)
        }
        if (ppH > camBoundPlayer.max) {
          scaleY = camBoundPlayer.max * (cam.height / playerBound.height)
        } else if (ppH < camBoundPlayer.min) {
          scaleY = camBoundPlayer.min * (cam.height / playerBound.height)
        }

        if (scaleX >= 1 && scaleY >= 1) {
          scale = Math.max(scaleX, scaleY)
        } else if (scaleX < 1 && scaleY < 1) {
          scale = Math.min(scaleX, scaleY)
        } else {
          scale = Math.min(scaleX, scaleY)
        }

        // rule 2: limit scale to pre-defined bounds
        if (scale < camBoundLimit.min) {
          scale = camBoundLimit.min
        }
        if (scale > camBoundLimit.max) {
          scale = camBoundLimit.max
        }

        // rule 3: make world stretch to cover the window
        scaleX = scaleY = scale
        const displayW = cam.width / scale
        const displayH = cam.height / scale
        if (displayW > gameConfig.world.width) {
          scaleX = cam.width / gameConfig.world.width
        }
        if (displayH > gameConfig.world.height) {
          scaleY = cam.height / gameConfig.world.height
        }
        scale = Math.min(scaleX, scaleY)

        smrCamScale.setValue(scale)
        const smoothedScale = smrCamScale.getValue()
        this.g.camera.scale.setTo(smoothedScale, smoothedScale)

        // Center player
        smrCamX.setValue(
          (playerBound.right + playerBound.left) / 2 * this.g.camera.scale.x - (this.g.camera.width) / 2
        )
        smrCamY.setValue(
          (playerBound.top + playerBound.bottom) / 2 * this.g.camera.scale.y - (this.g.camera.height) / 2
        )

        this.g.camera.x = Math.round(smrCamX.getValue())
        this.g.camera.y = Math.round(smrCamY.getValue())
      }

      if (this.g.$debug) {
        const rect = this.game.getViewRect()
        this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
        this.game.$graphics.drawRect(rect.left, rect.top, (rect.right - rect.left), (rect.bottom - rect.top))
        this.game.$graphics.lineStyle(0, 0x000000, 0)
      }

      this.g.$viewRect = this.g.getViewRect()

      this.g.cullScene()
      this.g.$renderList.forEach((item) => {
        item.update()
      })

      // Update leaderBoard
      if (this.g.$leaderBoardTimer > 40) {
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

        this.g.$leaderBoardTimer = -1
      }
      this.g.$leaderBoardTimer++

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
      if (this.g.$debug) {
        this.game.debug.cameraInfo(this.game.camera, 32, 64)
        this.game.debug.text(`Render objects number: ${this.g.$renderList.length}`, 30, 200, '#000')
        this.game.debug.text(`Camera scale: ${this.g.camera.scale.x}`, 30, 240, '#000')
        this.game.debug.pointer(this.game.input.activePointer)
      }
    },
    shutdown () {
      // Reset timers
      clearInterval(this.g.$heartbeatTimer)
      this.g.$heartbeatTimer = -1
      this.g.$leaderBoardTimer = 0

      // Reset websocket
      this.g.$ws.renew()

      // Clear up data
      this.g.$graphics.clear()
      this.$viewRect = null
      this.g.$renderList = []
      this.g.$playerList.clear()
      this.g.$foodList.clear()
      this.g.$virusList.clear()
      this.g.$massFoodList.clear()

      Object.keys(this.g.$sprites).forEach((key) => {
        this.g.$sprites[key].destroy()
      })
      this.g.$sprites = null
      Object.keys(this.g.$sounds).forEach((key) => {
        this.g.$sounds[key].destroy()
      })
      this.g.$sounds = null

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
  loadStart () {
    preloadIntervalId = setInterval(() => {
      this.game.$overlay.setLoadingText(`稍等，正在载入资源...${this.game.load.progress}%`)
    }, 100)
  },
  loadComplete () {
    this.g.$isAssetsPreloaded = true
    clearInterval(preloadIntervalId)
    this.game.load.onLoadStart.remove(Callbacks.loadStart, this)
    this.game.load.onLoadComplete.remove(Callbacks.loadComplete, this)
  },
  resize: throttle(function onResize (scale) {
    const deviceRatio = window.devicePixelRatio || 1
    scale.setGameSize(
      this.game.parent.clientWidth * deviceRatio,
      this.game.parent.clientHeight * deviceRatio)
    // Add this to fix input scale jetter
    this.game.input.scale = new Phaser.Point(deviceRatio, deviceRatio)
  }, 500),
  keyboardPress (e, f) {

  },
  keyboardDown (e) {
    // console.log('down', e)
    switch (e.code) {
      case 'Space':
        this.game.$overlay.refs.controlSplit.classList.add('active')
        break
      case 'KeyW':
        this.game.$overlay.refs.controlShrink.classList.add('active')
        break
    }
  },
  keyboardUp (e) {
    switch (e.code) {
      case 'Space':
        this.game.splitPlayer()
        this.game.$overlay.refs.controlSplit.classList.remove('active')
        break
      case 'KeyW':
        this.game.shrinkPlayer()
        this.game.$overlay.refs.controlShrink.classList.remove('active')
        break
      // case 'KeyM':
      //   this.game.$overlay.toggleMenu()
    }
  },
  move (pointer, x, y, fromClick) {
    // Get position of world
    mX = (x + this.game.camera.x) / this.game.camera.scale.x
    mY = (y + this.game.camera.y) / this.game.camera.scale.y

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

      this.game.$ws.emit('op', {
        t: 'mv',
        x: nX,
        y: nY,
        userID: this.game.$info.userId,
        gameID: this.game.$info.gameId
      })

      smrGuideLineOpacity.setValue(1)
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
    this.$sprites = null
    this.$sounds = null
    this.$isAssetsPreloaded = false
    // this.$audioDecoded = false
    this.$playerList = new Map()
    this.$foodList = new Map()
    this.$virusList = new Map()
    this.$massFoodList = new Map()
    this.$renderList = []
    this.$info = {}
    this.$heartbeatTimer = -1
    this.$leaderBoardTimer = 0
    this.$debug = (process.env.NODE_ENV === 'development')

    this.state.add('game', States.game)
    this.state.add('idle', States.idle)

    this.state.start('idle')
  }
  exit () {
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
      this.$overlay.setState('gamePanel')
    })
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

    // LOD edges
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
      case 'massFood':
        if (type === 'player') {
          list = this.$playerList
          Obj = Player
        } else if (type === 'virus') {
          list = this.$virusList
          Obj = Virus
        } else if (type === 'food') {
          list = this.$foodList
          Obj = Food
        } else if (type === 'massFood') {
          list = this.$massFoodList
          Obj = MassFood
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
      case 'massFood':
        list = this.$massFoodList
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
      case 'massFood':
        list = this.$massFoodList
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

    const sortList = []
    //
    // TODO: sorting characters
    this.$playerList.forEach((player) => {
      if (player.cells && player.cells.length) {
        player.cells.forEach((cell) => {
          if (this.isInView(cell)) {
            sortList.push(cell)
          }

          // FIXME: debug
          // console.log(cell.id, this.$info.myId)
          // if (player.id === this.$info.myId && index === 0) {
          //   let sx = smootherX.getValue()
          //   let sy = smootherY.getValue()
          //   const _this = this
          //   this.$renderList.push({
          //     update () {
          //       _this.$graphics.beginFill(0xFF0000, 1)
          //       _this.drawCircle(Math.round(sx), Math.round(sy), cell.r)
          //       _this.$graphics.endFill()
          //     }
          //   })
          // }
          // FIXME:
        })
        if (this.isInView(player)) {
          sortList.push(player)
        }
      }
    })

    this.$virusList.forEach((virus) => {
      if (this.isInView(virus)) {
        sortList.push(virus)
      }
    })

    this.$massFoodList.forEach((massFood) => {
      if (this.isInView(massFood)) {
        sortList.push(massFood)
      }
    })

    sortList.sort((a, b) => {
      if (a.r && b.r) {
        if (a.r > b.r) {
          return 1
        } else if (a.r < b.r) {
          return -1
        } else {
          return 0
        }
      } else {
        if (!a.r && b.r) {
          return -1
        }
        if (!b.r && a.r) {
          return 1
        }
        return 0
      }
    })

    this.$renderList = this.$renderList.concat(sortList)
  }
  isFullScreen () {
    const fse = document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement

    return !!fse
  }
  enterFullScreen () {
    if (!this.isFullScreen()) {
      const d = document.documentElement
      const requestFS = d.requestFullscreen ||
        d.webkitRequestFullscreen ||
        d.mozRequestFullScreen ||
        d.msRequestFullscreen
      requestFS.call(d)
    }
  }
  exitFullScreen () {
    if (this.isFullScreen()) {
      const d = document
      const exitFS = d.exitFullscreen ||
        d.webkitExitFullscreen ||
        d.mozCancelFullScreen ||
        d.msExitFullscreen
      exitFS.call(d)
    }
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
  splitPlayer () {
    const my = this.getCharacter('player', this.$info.myId)
    if (my) {
      if (this.$sounds['split'].isDecoded && this.$overlay.menuSettings.sfxPlay) {
        this.$sounds['split'].restart()
        this.$sounds['split'].play()
      }
      this.$ws.emit('op', {
        t: 'space',
        userID: this.$info.userId,
        gameID: this.$info.gameId
      })
    }
  }
  shrinkPlayer () {
    const my = this.getCharacter('player', this.$info.myId)
    if (my) {
      if (this.$sounds['shrink'].isDecoded && this.$overlay.menuSettings.sfxPlay) {
        this.$sounds['shrink'].restart()
        this.$sounds['shrink'].play()
      }
      this.$ws.emit('op', {
        t: 'w',
        userID: this.$info.userId,
        gameID: this.$info.gameId
      })
    }
  }
}

export default Game
