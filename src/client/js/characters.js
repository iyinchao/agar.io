export class Character {
  constructor (options) {
    const defaultOptions = {}
    Object.assign({}, defaultOptions, options)
    this.id = options.id
    this.value = options.value
    this.radius = options.radius
    this.game = options.game
    this.position = options.position
    this.name = options.name
  }
  update () {

  }
  destroy () {

  }
}

export class Player extends Character {
  constructor (options) {
    super(options)
    this.cells = []
    this.text = this.game.add.text(0, 0, this.name, {
      font: 'bold 32px Arial',
      fill: '#FFF',
      stroke: '#000',
      strokeThickness: 3
    })
    this.text.anchor.setTo(0.5)
    this.value = 1
  }
  update () {
    super.update()
    // Draw self
    this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
    this.game.$graphics.beginFill(0xa92cc8, 1)
    this.game.$graphics.drawCircle(this.position.x, this.position.y, this.value)
    this.text.x = this.position.x
    this.text.y = this.position.y
    this.text.fontSize = this.value > 60 ? 32 : this.value / 2
    // Draw cells

  }
  destroy () {
    super.destroy()
  }
}

export class Food extends Character {
  constructor (options) {
    super(options)
  }
  update () {
    super.update()

    this.game.$graphics.lineStyle(10, 0xd75cf6, 1)
    this.game.$graphics.beginFill(0xa92cc8, 1)
    this.game.$graphics.drawCircle(this.position.x, this.position.y, this.value)
  }
}

export class Virus extends Character {
  constructor (options) {
    super(options)
  }
}
