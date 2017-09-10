import template from '@/html/overlay.html'
import utils from '@/js/utils'

// class Component {
//   constructor (options) {
//     if (!options) {
//       utils.logger('error', '[class Component] Options must be specified in constructor')
//       return
//     }

//     const defaultOptions = {

//     }

//     const opt = Object.assign({}, defaultOptions, options)
//     this.dom = opt.dom
//     this.parent = opt.parent
//     // Gather
//   }
//   show () {
//     this.dom.classList.remove('hidden')
//   }
//   hide () {
//     this.dom.classList.add('hidden')
//   }
// }

// class UserPanel extends Component {
//   constructor (options) {
//     super(options)
//   }
// }

class Overlay {
  constructor (option) {
    this.game = option.game
    // Compile dom
    const _complierDom = document.createElement('div')
    _complierDom.innerHTML = template
    //
    this.dom = _complierDom.querySelector('#overlay')
    document.body.appendChild(this.dom)
    // Init components
    this.dom.querySelector('#user-panel')

    // Gather refs
    this.refs = {}
    const refList = this.dom.querySelectorAll('[data-ref]')
    refList.forEach((dom) => {
      const refAttr = dom.getAttribute('data-ref')
      if (refAttr) {
        this.refs[refAttr] = dom
      }
    })

    this.init()
  }
  init () {
    this.refs.btStartGame.addEventListener('click', (e) => {
      this.onBtStartGameClick(e)
    })
  }
  hide (dom) {
    dom.classList.add('hidden')
  }
  show (dom) {
    dom.classList.remove('hidden')
  }
  onBtStartGameClick (e) {
    if (this.refs.textNick.value) {
      this.game.$myPlayerName = this.refs.textNick.value
      this.game.state.start('game')
      e.target.blur()
      //this.hide(this.refs.mask)
      //this.hide(this.refs.panelGame)
    }
  }
}

export default Overlay
