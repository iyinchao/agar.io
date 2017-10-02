/**
 * @desc Websocket connector
 * @author Charlieyin<charlieyin@tencent.com>
 */

import io from 'socket.io-client'
import projectConfig from '~/config/project'

export class WS {
  constructor () {
    this.socket = this.factory()
  }
  factory () {
    return io(
      projectConfig.server.ws,
      { autoConnect: false })
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
    this.socket.disconnect()
  }
  renew () {
    this.disconnect()
    this.socket = null
    this.socket = this.factory()
    return this.socket
  }
}

export default WS
