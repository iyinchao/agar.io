import template from '@/html/overlay.html'
import utils from '@/js/utils'

class Component {
  constructor (options) {
    if (!options) {
      utils.logger('error', '[class Component] Options must be specified in constructor')
      return
    }

    const defaultOptions = {

    }

    const opt = Object.assign({}, defaultOptions, options)
    this.dom = opt.dom
    this.parent = opt.parent
    // Gather
  }
  show () {
    this.dom.classList.remove('hidden')
  }
  hide () {
    this.dom.classList.add('hidden')
  }
}

class UserPanel extends Component {
  constructor (options) {
    super(options)
  }
}

class Overlay {
  constructor (game) {
    this.game = game
    // Compile dom
    const _complierDom = document.createElement('div')
    _complierDom.innerHTML = template
    //
    this.dom = _complierDom.querySelector('#overlay')
    document.body.appendChild(this.dom)
    // Init components
    this.dom.querySelector('#user-panel')
    this.parent = this

    // Gather refs
    this.ref = {}
    const refList = this.dom.querySelectorAll('[data-ref]')
    refList.forEach((dom) => {
      const attrs = dom.attributes
      if (attrs['data-ref']) {
        // this.ref =
      }
    })
    // Init children

  }
}

export default Overlay
