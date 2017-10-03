import '@/styles/app.scss'

import Game from '@/js/game'
import WS from '@/js/ws'
//
import Overlay from '@/js/overlay'

const ws = new WS()
const game = new Game({
  ws
})
const overlay = new Overlay({
  ws
})

overlay.game = game
game.$overlay = overlay

// Init pahser globals
window.PhaserGlobal = {}

if (process.env.NODE_ENV === 'production') {
  window.PhaserGlobal.hideBanner = true
} else if (process.env.NODE_ENV === 'development') {
  window.PhaserGlobal.hideBanner = false
}

if (process.env.NODE_ENV === 'development') {
  window.$game = game
  window.$overlay = overlay
}
