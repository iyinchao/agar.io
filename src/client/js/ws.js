/**
 * @desc Websocket connector
 * @author Charlieyin<charlieyin@tencent.com>
 */

import io from 'socket.io-client'

// import projectConfig from '~/config/project'

export class WS {
  constructor () {
    this.socket = io(
      'http://localhost:3000', // projectConfig.server.ws,
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
  destroy () {

  }
}

export default WS
