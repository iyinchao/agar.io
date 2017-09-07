export class Character {
  constructor (options) {
    const defaultOptions = {}
    Object.assign({}, defaultOptions, options)
    this.id = options.id
    this.value = options.value
    this.radius = options.radius
    this.game = options.game
  }
  update () {

  }
}

var a = 0

export class Player extends Character {
  constructor (options) {
    super(options)
    this.cells = []
    this.graphics = this.game.add.graphics(0, 0)
  }
  update () {
    a++
    this.graphics.clear()
    this.graphics.lineStyle(10, 0xffd900, 1)
    this.graphics.beginFill(0xFF0000, 1)
    this.graphics.drawCircle(a, 0, a)
  }
}

export class Food extends Character {
  constructor (options) {
    super(options)
  }
}
