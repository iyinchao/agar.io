/**
 * @desc Websocket connector
 * @author Charlieyin<charlieyin@tencent.com>
 */

import io from 'socket.io-client'

// import { getConfigForEnv } from '~/config/project'

// console.log(getConfigForEnv)

// //const projectConfig = getConfigForEnv(process.env.NODE_ENV)

// console.log(projectConfig)

export class WS {
  constructor () {
    this.socket = io(
      'http://localhost:3000',
      {
        autoConnect: false
      }
    )
  }
  on () {
    return this.socket.on
  }
  connect () {
    this.socket.open()
  }
  disconnect () {
    this.socket.close()
  }
}

export default WS
