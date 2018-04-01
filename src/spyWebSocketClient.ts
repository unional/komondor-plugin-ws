import { SpyContext } from 'komondor-plugin'
import WebSocket, { ClientOptions } from 'ws'

import { createFakeClientBase } from './createFakeClientBase'

export function spyWebSocketClient(context: SpyContext, subject: typeof WebSocket): Partial<typeof WebSocket> {
  // return type is Partial<typeof WebSocket> because the implementation is not complete.
  return class WebSocketClientSpy extends createFakeClientBase(subject) {
    webSocket: WebSocket
    constructor(address: string, options?: ClientOptions) {
      super()
      this.webSocket = new subject(address, options)

      context.add('ws', 'constructor', [address, options])
    }
    on(event: string, listener) {
      const call = context.newCall()
      const wrapped = (...args) => {
        call.invoke(args, { methodName: 'on', event })
        listener(...args)
      }
      super.on(event, wrapped)
      return this
    }
    send(message, options?, cb?) {
      const call = context.newCall()
      call.invoke([message, options, cb], { methodName: 'send' })
      super.send(message, options, cb)
    }
    terminate() {
      const call = context.newCall()
      call.invoke([], { methodName: 'terminate' })
      super.terminate()
    }
  }
}
