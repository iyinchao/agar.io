import TinyColor from 'tinycolor2'

export class Character {
  constructor (options) {
    const defaultOptions = {}
    Object.assign({}, defaultOptions, options)
    this.game = options.game

    this.id = options.id
    this.radius = options.radius
    this.x = options.x
    this.y = options.y
    this.hue = options.hue

  }
  hueToHex (hue) {
    return parseInt(TinyColor({h: hue, s: 100, v: 100}).toHex(), 16)
  }
  update () {

  }
  destroy () {

  }
}

export class Cell extends Character {
  constructor (option) {
    super(option)
    this._hexColor = option._hexColor
    this._hexFillColor = option._hexFillColor
  }
  update () {
    this.game.$graphics.lineStyle(10, this._hexColor, 1)
    this.game.$graphics.beginFill(this._hexFillColor, 1)
    this.game.$graphics.drawCircle(this.x, this.y, this.radius)
    this.game.$graphics.endFill()
    this.game.$graphics.lineWidth = 0
  }
}

export class Player extends Character {
  constructor (options) {
    super(options)
    this.name = options.name
    this._hexColor = this.hueToHex(this.hue)
    this._hexFillColor = parseInt(TinyColor({h: this.hue, s: 100, v: 100}).darken(10).toHex(), 16)
    this.cells = []

    this.cells = options.cells.map((cell, index) => {
      return new Cell({
        id: this.id,
        _cellId: index,
        hue: this.hue,
        _hexColor: this._hexColor,
        _hexFillColor: this._hexFillColor,
        radius: cell.radius,
        game: this.game,
        x: cell.x,
        y: cell.y
      })
    })
    // this.text = this.game.add.text(0, 0, this.name, {
    //   font: 'bold 32px Arial',
    //   fill: '#FFF',
    //   stroke: '#000',
    //   strokeThickness: 3
    // })
    // this.text.anchor.setTo(0.5)
  }
  update () {
    super.update()

    if (this.cells && this.cells.length) {
      // let largest = 0 // Largest cell index
      // let largestR = 0
      this.cells.forEach((cell, index) => {
        // if (cell.radius > largestR) {
        //   largest = index
        // }
        // this.game.$graphics.lineStyle(10, this._hexColor, 1)
        // this.game.$graphics.beginFill(this._hexFillColor, 1)
        // this.game.$graphics.drawCircle(cell.x, cell.y, cell.radius)
        // this.game.$graphics.endFill()
        // this.game.$graphics.lineWidth = 0
      })
    }
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
  destroy () {
    super.destroy()
  }
}

export class Food extends Character {
  constructor (options) {
    super(options)
    this._hexColor = this.hueToHex(this.hue)
  }
  update () {
    super.update()
    // this.game.$graphics.beginFill(0xa92cc8, 1)
    // this.game.$graphics.drawCircle(this.position.x, this.position.y, 20)
    // this.game.$graphics.endFill()
    // console.log(this._hexColor)
    // this.game.$graphics.beginFill(0xa92cc8, 1)
    // this.game.$graphics.drawCircle(this.x, this.y, 20)
    this.game.$graphics.beginFill(this._hexColor)
    this.game.$graphics.drawCircle(this.x, this.y, this.radius)
    // this.game.drawCircle(this.x, this.y, this.radius, 6)
    this.game.$graphics.endFill()
  }
}

export class Virus extends Character {
  constructor (options) {
    super(options)
  }
}
