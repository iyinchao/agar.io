import template from '@/html/overlay.html'

class Overlay {
  constructor (game) {
    this.game = game
    // Compile dom
    const _complierDom = document.createElement('div')
    _complierDom.innerHTML = template
    //
    this.dom = _complierDom.querySelector('#overlay')
    document.body.appendChild(this.dom)
    _complierDom.querySelector('#user-panel')
  }
}

export default Overlay
