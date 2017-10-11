import Promise from 'bluebird'
import md5 from 'crypto-js/md5'

import template from '@/html/overlay.html'
import projectConfig from '~/config/project'
import storage from '@/js/storage'

/* eslint-disable no-useless-escape */
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const nickRegex = /^.{1,}$/
const passwordRegex = /^.{6,}$/
/* eslint-enable no-useless-escape */

let isFirstEnterFullScreen = true

class Overlay {
  constructor (option) {
    this.game = option.game
    // Compile dom
    const _complierDom = document.createElement('div')
    _complierDom.innerHTML = template
    //
    this.dom = _complierDom.querySelector('#overlay')
    document.body.appendChild(this.dom)

    // Gather refs
    this.refs = {}
    const refList = this.dom.querySelectorAll('[data-ref]')
    for (let i = 0; i < refList.length; i++) {
      const dom = refList[i]
      const refAttr = dom.getAttribute('data-ref')
      if (refAttr) {
        this.refs[refAttr] = dom
      }
    }
    // refList.forEach((dom) => {
    //   const refAttr = dom.getAttribute('data-ref')
    //   if (refAttr) {
    //     this.refs[refAttr] = dom
    //   }
    // })

    this.toastTimeout = 0
    this.xhrList = new Map()
    this.userInfo = null // null represents not logged in status.

    this.init()
  }
  init () {
    this.refs.btLogin.addEventListener('click', (e) => {
      this.onBtLoginClick(e)
    })
    this.refs.btRegister.addEventListener('click', (e) => {
      this.onBtRegisterClick(e)
    })
    this.refs.btStartGame.addEventListener('click', (e) => {
      this.onBtStartGameClick(e)
    })
    this.refs.btDiedReborn.addEventListener('click', (e) => {
      this.onBtDiedRebornClick(e)
    })
    this.refs.btDiedLeave.addEventListener('click', (e) => {
      this.onBtDiedLeaveClick(e)
    })
    this.refs.btPlayAsGuest.addEventListener('click', (e) => {
      this.onBtPlayAsGuest(e)
    })
    this.refs.switcherLogin.addEventListener('click', () => {
      this.setUserPanelMode('login')
    })
    this.refs.switcherReg.addEventListener('click', () => {
      this.setUserPanelMode('register')
    })
    this.refs.btChangeRole.addEventListener('click', (e) => {
      this.onBtChangeRoleClick(e)
    })
    this.refs.controlSplit.addEventListener('click', () => {
      this.onControlSplitClick()
    })
    this.refs.controlShrink.addEventListener('click', () => {
      this.onControlShrinkClick()
    })
    // This is to prevent focus change.
    this.refs.controls.addEventListener('mousedown', (e) => {
      e.preventDefault()
    }, true)

    this.setState('userPanel')

    // Pickup localstorage
    this.relogin()
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
        dom.classList.remove('hide')
      }, 20)
    } else {
      if (dom.classList.contains('hide')) {
        dom.removeEventListener('transitionend', this.onHideTransitionEnd)
        dom.classList.remove('hide')
      }
    }
  }
  isBrowserInactive () {
    return (document.hidden) || (!document.hasFocus())
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
      timeout: 1200
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
    const op = Object.assign(
      {},
      option)

    switch (state) {
      case 'userPanel':
        if (op.clearData) {
          this.refs.regEmail.value = ''
          this.refs.regNick.value = ''
          this.refs.regPassword.value = ''
          this.refs.regPasswordRep.value = ''
          this.refs.loginEmail.value = ''
          this.refs.loginPassword.value = ''
          this.refs.gameNick.value = ''
        }
        this.show(this.refs.mask)
        this.show(this.refs.panelUser)
        this.hide(this.refs.panelGame)
        this.hide(this.refs.infoLoading)
        this.hide(this.refs.infoDied)
        this.hide(this.refs.leaderBoard)
        if (op.mode === 'register') {
          this.setUserPanelMode('register')
        } else {
          this.setUserPanelMode('login')
        }
        break
      case 'gamePanel':
        this.show(this.refs.mask)
        this.show(this.refs.panelGame)
        this.hide(this.refs.panelUser)
        this.hide(this.refs.infoLoading)
        this.hide(this.refs.infoDied)
        this.hide(this.refs.leaderBoard)
        this.setGamePanelState()
        break
      case 'died':
        this.show(this.refs.mask)
        this.show(this.refs.infoDied)
        break
      case 'preloading':
        this.show(this.refs.mask)
        this.setLoadingText('正在载入资源...')
        this.show(this.refs.infoLoading)
        this.hide(this.refs.panelGame)
        this.hide(this.refs.infoDied)
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
    const op = Object.assign(
      {},
      { loadingText: '请稍候...' },
      option)

    switch (mode) {
      case 'login':
        this.refs.switcherLogin.classList.add('selected')
        this.refs.switcherReg.classList.remove('selected')
        this.show(this.refs.panelUserContent)
        this.hide(this.refs.panelUserLoading)
        this.show(this.refs.panelUserLogin)
        this.hide(this.refs.panelUserReg)
        break
      case 'register':
        this.refs.switcherLogin.classList.remove('selected')
        this.refs.switcherReg.classList.add('selected')
        this.show(this.refs.panelUserContent)
        this.hide(this.refs.panelUserLoading)
        this.show(this.refs.panelUserReg)
        this.hide(this.refs.panelUserLogin)
        break
      case 'loading':
        this.hide(this.refs.panelUserContent)
        this.show(this.refs.panelUserLoading)
        this.refs.panelUserLoadingText.innerText = op.loadingText
        break
    }
  }
  setGamePanelState () {
    if (this.userInfo) {
      this.refs.gameNick.disabled = true
      this.refs.gameNick.value = this.userInfo.nickname
      this.show(this.refs.gameTitle)
      this.show(this.refs.gamePanelAvatar)
      this.setAvatar(this.refs.gamePanelAvatar, this.userInfo.avatarURL)
    } else {
      this.refs.gameNick.disabled = false
      // this.refs.gameNick.value = ''
      this.show(this.refs.gameTitle)
      this.hide(this.refs.gamePanelAvatar)
    }
  }
  setAvatar (dom, url) {
    const imageDom = dom.querySelector('.image')
    if (imageDom) {
      imageDom.style.backgroundImage = `url(${url})`
    } else {
      console.warn('@setAvatar:', 'Can not find ".image" dom to set avatar.')
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
    this.xhrList.set('login', xhr)
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
      this.xhrList.delete('login')
    })
  }
  register (email, nick, password) {
    const xhr = new XMLHttpRequest()
    this.xhrList.set('register', xhr)
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
            reject(new Error('register'))
          }
        }
      })
      xhr.addEventListener('error', (e) => {
        reject(new Error('network'))
      })
      xhr.open(
        'GET',
        `${projectConfig.server.host}/register?id=${email}&name=${nick}&passwd=${password}`,
        true)
      xhr.send()
    }).finally(() => {
      this.xhrList.delete('register')
    })
  }
  relogin () {
    this.setUserPanelMode('loading', { loadingText: '请稍候...' })

    const info = storage.get('userInfo')
    if (!info) {
      this.setUserPanelMode('login')
      return
    }

    const email = info.email
    const password = info.password

    this.login(email, password).then((res) => {
      this.showToast(`${res.nick_name}, 欢迎回来~`, { timeout: 2000 })
      // Store user info
      this.userInfo = {
        nickname: res.nick_name,
        avatarURL: this.getAvatarURL(email),
        email,
        password
      }

      setTimeout(() => {
        this.setState('gamePanel')
      }, 500)
    }).catch((e) => {
      this.setUserPanelMode('login')
      switch (e.message) {
        case 'login':
          this.showToast('登录失败，用户名或密码错误')
          break
        case 'network':
          this.showToast('网络错误')
          break
      }
    })
  }
  getAvatarURL (email) {
    let e = email
    if (typeof email !== 'string') {
      e = ''
    }
    return `https://www.gravatar.com/avatar/${md5(e.trim().toLowerCase())}?d=identicon&s=64`
  }
  onBtDiedRebornClick (e) {
    this.game.reborn()
      .then(() => {

      })
      .catch((e) => {
        console.log(e)
      })
  }
  onBtDiedLeaveClick (e) {
    this.game.exit()
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
    this.setUserPanelMode('loading', { loadingText: '正在登录...' })

    if (this.xhrList.has('login')) {
      return
    }

    this.login(email, password).then((res) => {
      this.showToast(`${res.nick_name}, 欢迎回来~`, { timeout: 2000 })
      // Store user info
      this.userInfo = {
        nickname: res.nick_name,
        avatarURL: this.getAvatarURL(email),
        email,
        password
      }

      storage.set('userInfo', this.userInfo, { expire: 3 * 24 * 3600 * 1000 })

      this.setState('gamePanel')
    }).catch((e) => {
      console.log(e.message)
      this.setUserPanelMode('login')
      switch (e.message) {
        case 'login':
          this.showToast('登录失败，用户名或密码错误')
          break
        case 'network':
          this.showToast('网络错误')
          break
      }
    })
  }
  onBtRegisterClick (e) {
    const email = this.refs.regEmail.value.trim()
    const nick = this.refs.regNick.value.trim()
    const password = this.refs.regPassword.value
    const passwordRep = this.refs.regPasswordRep.value

    if (!emailRegex.test(email)) {
      this.showToast('Email格式不正确')
      this.refs.regEmail.focus()
      return
    }

    if (!nickRegex.test(nick)) {
      this.showToast('昵称不能为空')
      this.refs.regNick.focus()
      return
    }

    if (!passwordRegex.test(password)) {
      this.showToast('密码至少需要6个字符')
      this.refs.regPassword.focus()
      return
    }

    if (passwordRep !== password) {
      this.showToast('两次输入的密码不一致')
      this.refs.regPasswordRep.focus()
      return
    }

    //
    this.setUserPanelMode('loading', { loadingText: '正在注册...' })

    if (this.xhrList.has('register')) {
      return
    }

    this.register(email, nick, password).then((res) => {
      console.log(res)

      setTimeout(() => {
        this.showToast('注册成功')
        // FIXME: Mocked
        this.setUserPanelMode('login')
      }, 1000)
    }).catch((e) => {
      console.log(e.message)
      this.setUserPanelMode('register')
      switch (e.message) {
        case 'register':
          this.showToast('注册失败，Email可能已被注册')
          break
        case 'network':
          this.showToast('网络错误')
          break
      }
    })
  }
  onBtChangeRoleClick (e) {
    // Clear user info
    if (this.userInfo) {
      this.showToast('你已登出~')
    }
    this.userInfo = null
    storage.delete('userInfo')

    this.setState('userPanel', { clearData: true })
  }
  onBtStartGameClick (e) {
    if (this.refs.gameNick.value) {
      this.game.$info.myName = this.refs.gameNick.value
      this.game.state.start('game')
      if (isFirstEnterFullScreen) {
        if (!this.game.device.desktop) {
          this.game.enterFullScreen()
          this.isFirstEnterFullScreen = false
        }
      }
    } else {
      this.showToast('球球需要一个昵称')
      this.refs.gameNick.focus()
    }
  }
  onBtPlayAsGuest (e) {
    this.setState('gamePanel')
  }
  onControlSplitClick () {
    this.game.splitPlayer()
  }
  onControlShrinkClick () {
    this.game.shrinkPlayer()
  }
}

export default Overlay
