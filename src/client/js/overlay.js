import Promise from 'bluebird'

import template from '@/html/overlay.html'
import utils from '@/js/utils'
import projectConfig from '~/config/project'

/* eslint-disable no-useless-escape */
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const passwordRegex = /^.{6,}$/
/* eslint-enable no-useless-escape */

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

    this.toastTimeout = 0
    this.xhrList = []

    this.init()
  }
  init () {
    this.refs.btLogin.addEventListener('click', (e) => {
      this.onBtLoginClick(e)
    })
    this.refs.btStartGame.addEventListener('click', (e) => {
      this.onBtStartGameClick(e)
    })
    this.refs.btDiedReborn.addEventListener('click', (e) => {
      this.onBtDiedRebornClick(e)
    })
    this.refs.btPlayAsGuest.addEventListener('click', (e) => {
      this.onBtPlayAsGuest(e)
    })
    this.refs.switcherLogin.addEventListener('click', () => {
      this.setUserPanelMode('login')
    })
    this.refs.switcherReg.addEventListener('click', () => {
      this.setUserPanelMode('reg')
    })

    // Check session storage
    this.setState('userPanel')
  }
  hide (dom) {
    if (!dom.classList.contains('hidden')) {
      if (!dom.classList.contains('hide')) {
        dom.addEventListener('transitionend', this.onHideTransitionEnd)
        dom.classList.add('hide')
      }
    }
  }
  show (dom) {
    if (dom.classList.contains('hidden')) {
      dom.classList.remove('hidden')
      dom.classList.add('hide')
      setTimeout(() => {
        console.log(dom.classList.contains('hide'))
        dom.classList.remove('hide')
      }, 20)
    } else {
      if (dom.classList.contains('hide')) {
        dom.removeEventListener('transitionend', this.onHideTransitionEnd)
        dom.classList.remove('hide')
      }
    }
  }
  onHideTransitionEnd (e) {
    const target = e.target || e.srcElement
    if (target !== this) {
      return
    }
    if (target.classList.contains('hide')) {
      target.classList.remove('hide')
      target.classList.add('hidden')
    }
    target.removeEventListener('transitionend', this.onHideTransitionEnd)
  }
  showToast (content, option) {
    if (!content) {
      return
    }

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout)
      this.toastTimeout = 0
    }

    this.refs.toast.innerText = content

    const op = Object.assign({}, {
      timeout: 1000
    }, option)

    this.show(this.refs.toast)
    this.toastTimeout = setTimeout(() => {
      this.hideToast()
      this.toastTimeout = 0
    }, op.timeout)
  }
  hideToast () {
    this.hide(this.refs.toast)
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
        this.setUserPanelMode('login')
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
  setUserPanelMode (mode, option) {
    switch (mode) {
      case 'login':
        this.refs.switcherLogin.classList.add('selected')
        this.refs.switcherReg.classList.remove('selected')
        this.show(this.refs.panelUserLogin)
        this.hide(this.refs.panelUserReg)
        break
      case 'reg':
        this.refs.switcherLogin.classList.remove('selected')
        this.refs.switcherReg.classList.add('selected')
        this.show(this.refs.panelUserReg)
        this.hide(this.refs.panelUserLogin)
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
  login (email, password) {
    const xhr = new XMLHttpRequest()
    this.xhrList['login'] = xhr
    return new Promise((resolve, reject) => {
      xhr.addEventListener('readystatechange', (e) => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          let res
          try {
            res = JSON.parse(xhr.responseText)
          } catch (e) {
            reject(new Error('network'))
            return
          }
          if (res && res.ret_code === 0) {
            resolve(res)
          } else {
            reject(new Error('login'))
          }
        }
      })
      xhr.addEventListener('error', (e) => {
        reject(new Error('network'))
      })
      xhr.open(
        'GET',
        `${projectConfig.server.host}/login?id=${email}&passwd=${password}`,
        true)
      xhr.send()
    }).finally(() => {
      this.xhrList['login'] = null
    })
  }
  onBtDiedRebornClick (e) {
    this.game.reborn()
      .then(() => {

      })
      .catch((e) => {
        console.log(e)
      })
  }
  onBtLoginClick () {
    const email = this.refs.loginEmail.value.trim()
    const password = this.refs.loginPassword.value
    // Check email
    if (!emailRegex.test(email)) {
      this.showToast('Email格式不正确')
      this.refs.loginEmail.focus()
      return
    }

    if (!passwordRegex.test(password)) {
      this.showToast('密码至少需要6个字符')
      this.refs.loginPassword.focus()
      return
    }

    // Passed tests
    if (this.xhrList['login']) {
      return
    }
    this.login(email, password).then((res) => {
      console.log(res)
    }).catch((e) => {
      console.log(e.message)
    })
  }
  onBtStartGameClick (e) {
    if (this.refs.textNick.value) {
      this.game.$info.myName = this.refs.textNick.value
      this.game.state.start('game')
    } else {
      this.showToast('球球需要一个昵称')
      this.refs.textNick.focus()
    }
  }
  onBtPlayAsGuest (e) {
    this.setState('gamePanel')
  }
}

export default Overlay
