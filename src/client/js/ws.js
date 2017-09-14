/**
 * @desc Websocket connector
 * @author Charlieyin<charlieyin@tencent.com>
 */

import io from 'socket.io-client'

// import { getConfigForEnv } from '~/config/project'

// console.log(getConfigForEnv)

// //const projectConfig = getConfigForEnv(process.env.NODE_ENV)

// console.log(projectConfig)
let url = ''
if (process.env.NODE_ENV === 'develop') {
  url = 'http://localhost:3000'
} else {
  url = 'http://45.76.182.99:3000'
}

export class WS {
  constructor () {
    this.socket = io(
      url,
      {
        autoConnect: false
      }
    )
  }
  on (type, cb) {
    return this.socket.on(type, cb)
  }
  emit (type, data) {
    return this.socket.emit(type, data)
  }
  connect () {
    this.socket.open()
  }
  disconnect () {
    this.socket.close()
  }
}

export default WS
