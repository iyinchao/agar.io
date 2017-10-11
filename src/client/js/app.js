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
  game,
  ws
})

overlay.game = game
game.$overlay = overlay

// Init pahser globals
window.PhaserGlobal = {}

if (process.env.NODE_ENV === 'production') {
  window.PhaserGlobal.hideBanner = true

  // Added private hash to enable development drawing
  window.addEventListener('hashchange', (e) => {
    if (window.location.hash &&
      window.location.hash.substring(1) === 'debug') {
      game.$debug = true
    } else {
      game.$debug = false
    }
  })
} else if (process.env.NODE_ENV === 'development') {
  window.PhaserGlobal.hideBanner = false

  // Inject global variables for debugging
  window.$game = game
  window.$overlay = overlay
} else if (process.env.NODE_ENV === 'cordova') {
  window.PhaserGlobal.hideBanner = true
  // TODO: Do sth here
}
