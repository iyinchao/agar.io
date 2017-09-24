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
    this.refs.btDiedReborn.addEventListener('click', (e) => {
      this.onBtDiedRebornClick(e)
    })
    this.refs.btPlayAsGuest.addEventListener('click', (e) => {
      this.onBtPlayAsGuest(e)
    })

    // Check session storage
    this.setState('userPanel')
  }
  hide (dom) {
    dom.classList.add('hidden')
  }
  show (dom) {
    dom.classList.remove('hidden')
  }
  setState (state, option) {
    switch (state) {
      case 'userPanel':
        this.show(this.refs.mask)
        this.show(this.refs.panelUser)
        this.hide(this.refs.panelGame)
        this.hide(this.refs.infoLoading)
        this.hide(this.refs.infoDied)
        this.hide(this.refs.leaderBoard)
        break
      case 'gamePanel':
        this.show(this.refs.mask)
        this.show(this.refs.panelGame)
        this.hide(this.refs.panelUser)
        this.hide(this.refs.infoLoading)
        this.hide(this.refs.infoDied)
        this.hide(this.refs.leaderBoard)
        break
      case 'died':
        this.show(this.refs.mask)
        this.show(this.refs.infoDied)
        break
      case 'joining':
        this.show(this.refs.mask)
        this.setLoadingText('系好安全带，正在进入世界...')
        this.show(this.refs.infoLoading)
        this.hide(this.refs.panelGame)
        this.hide(this.refs.infoDied)
        break
      case 'gaming':
        this.hide(this.refs.mask)
        this.hide(this.refs.infoLoading)
        this.hide(this.refs.infoDied)
        this.show(this.refs.leaderBoard)
        break
      case 'reborning':
        this.setLoadingText('别急，正在等待重生...')
        this.show(this.refs.infoLoading)
        this.hide(this.refs.infoDied)
        this.hide(this.refs.leaderBoard)
        break
    }
  }
  setLoadingText (text) {
    this.refs.infoLoadingText.innerText = text
  }
  setLeaderBoard (list) {
    let html = ''
    if (Array.isArray(list) && list.length) {
      list.forEach((item) => {
        html += `<div class="name ${item.id === this.game.$info.myId ? 'self' : ''}">\
          ${item.rank}. (${Math.round(item.weight / 50)}) ${item.name}\
          </div>`
      })
    }

    if (!html) {
      this.hide(this.refs.leaderBoard)
    } else {
      this.show(this.refs.leaderBoard)
    }

    this.refs.leaderBoardContent.innerHTML = html
  }
  onBtDiedRebornClick (e) {
    this.game.reborn()
      .then(() => {

      })
      .catch((e) => {
        console.log(e)
      })
  }
  onBtStartGameClick (e) {
    if (this.refs.textNick.value) {
      this.game.$info.myName = this.refs.textNick.value
      this.game.state.start('game')
      e.target.blur()
      // this.hide(this.refs.mask)
      this.hide(this.refs.panelGame)
    }
  }
  onBtPlayAsGuest (e) {
    this.setState('gamePanel')
  }
}

export default Overlay
