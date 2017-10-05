import TinyColor from 'tinycolor2'
import { throttle } from 'lodash'

import gameConfig from '~/config/game'

export class Character {
  constructor (options) {
    const defaultOptions = {}
    const o = Object.assign({}, defaultOptions, options)
    Object.keys(o).forEach((key) => {
      this[key] = o[key]
    })
  }
  hueToHex (hue) {
    return parseInt(TinyColor({h: hue, s: 100, v: 100}).toHex(), 16)
  }
  update () {

  }
  destroy () {

  }
}

export class Player extends Character {
  constructor (options) {
    super(options)
    this._hexColor = this.hueToHex(this.hue)
    this._hexFillColor = parseInt(
      TinyColor({h: this.hue, s: 100, v: 100}).darken(10).toHex(),
      16)

    this.text = this.game.add.text(0, 0, this.name, {
      font: 'normal normal bold medium cell',
      fill: '#FFF',
      stroke: '#000',
      strokeThickness: 4
    })
    this.text.anchor.setTo(0.5)

    this._cells = []
    try {
      this._cells = JSON.parse(JSON.stringify(this.cells))
    } catch (e) {
      // slient
    }

    this._largestCellIndex = 0

    Object.defineProperty(this, 'cells', {
      get: function () {
        return this._cells
      },
      set: function (value) {
        if (Array.isArray(value)) {
          this._cells = value
        }
        let largestR = 0
        let largestIndex = 0
        this._cells.forEach((cell, index) => {
          this._cells[index].parent = this
          this._cells[index].update = this.updateCell.bind(this._cells[index])
          if (this._cells[index].r > largestR) {
            largestR = this._cells[index].r
            largestIndex = index
          }
          // this._cells[index].r = cell.radius ? cell.radius : cell.r
        })
        this._largestCellIndex = largestIndex
      }
    })

    this.setTextDirty = throttle(function () {
      this.text.dirty = true
    }, 1000)

    this.cells = this._cells
  }
  update () {
    // let largest = 0 // Largest cell index
    // let largestR = 0
    // if (this.cells && this.cells.length) {
    //   this.cells.forEach((cell, index) => {
    //     if (cell.r > largestR) {
    //       largest = index
    //       largestR = cell.r
    //     }
    //   })
    // }
    this.text.x = this.cells[this._largestCellIndex].x
    this.text.y = this.cells[this._largestCellIndex].y

    let fontSize = this.cells[this._largestCellIndex].r / 2
    if (fontSize > 36) {
      fontSize = 36
    } else if (fontSize < 12) {
      fontSize = 12
    }
    this.text.fontSize = fontSize

    this.setTextDirty()

      // let largest = 0 // Largest cell index
      // let largestR = 0
    //   this.cells.forEach((cell, index) => {
    //     if (cell.radius > largestR) {
    //       largest = index
    //     }
    //     this.game.$graphics.lineStyle(10, this._hexColor, 1)
    //     this.game.$graphics.beginFill(this._hexFillColor, 1)
    //     this.game.$graphics.drawCircle(cell.x, cell.y, cell.radius)
    //     this.game.$graphics.endFill()
    //     this.game.$graphics.lineWidth = 0
    //   })
    //   this.text.x = this.cells[largest].x
    //   this.text.y = this.cells[largest].y
    //   this.text.fontSize = this.cells[largest].radius > 60 ? 32 : this.cells[largest].radius / 2
    // }
    // Draw self
    // this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
    // this.game.$graphics.beginFill(0xa92cc8, 1)
    // this.game.$graphics.drawCircle(this.x, this.y, this.radius)
    // this.game.$graphics.endFill()
    // this.text.x = this.x
    // this.text.y = this.y
    // this.text.fontSize = this.radius > 60 ? 32 : this.r / 2
    // Draw cells
  }
  updateCell () {
    this.parent.game.$graphics.lineStyle(10, this.parent._hexColor, 1)
    this.parent.game.$graphics.beginFill(this.parent._hexFillColor, 1)
    // this.parent.game.$graphics.drawCircle(this.x, this.y, this.r * 2)
    this.parent.game.drawCircle(this.x, this.y, this.r)
    this.parent.game.$graphics.endFill()
    this.parent.game.$graphics.lineWidth = 0
  }
  destroy () {
    this.text.destroy()
  }
}

export class Food extends Character {
  constructor (options) {
    super(options)
    this._hexColor = this.hueToHex(this.hue)
  }
  update () {
    this.game.$graphics.beginFill(this._hexColor)
    this.game.drawCircle(this.x, this.y, this.r, 6)
    this.game.$graphics.endFill()
  }
}

export class Virus extends Character {
  constructor (options) {
    super(options)
    this._hexColor = this.hueToHex(gameConfig.virus.hue)
    this._hexFillColor = parseInt(
      TinyColor({h: gameConfig.virus.hue, s: 100, v: 100}).darken(13).toHex(),
      16)
  }
  update () {
    this.game.$graphics.lineStyle(8, this._hexColor, 1)
    this.game.$graphics.beginFill(this._hexFillColor)
    this.game.drawVirus(this.x, this.y, this.r, 6)
    this.game.$graphics.endFill()
    this.game.$graphics.lineWidth = 0
  }
}

export class MassFood extends Character {
  constructor (options) {
    super(options)
  }
  update () {
  }
}
