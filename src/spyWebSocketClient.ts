import { SpyContext, SpyInstance } from 'komondor-plugin'
import WebSocket, { ClientOptions } from 'ws'

import { createFakeClientBase } from './createFakeClientBase'

export function spyWebSocketClient(context: SpyContext, subject: typeof WebSocket): Partial<typeof WebSocket> {
  // return type is Partial<typeof WebSocket> because the implementation is not complete.
  return class WebSocketClientSpy extends createFakeClientBase(subject) {
    webSocket: WebSocket
    // tslint:disable-next-line:variable-name
    __komondor: { instance: SpyInstance } = {} as any

    constructor(address: string, options?: ClientOptions) {
      super()
      this.__komondor.instance = context.newInstance([address, options], { className: 'WebSocket' })
      this.webSocket = new subject(address, options)
    }
    on(event: string, listener) {
      const call = this.__komondor.instance.newCall()
      const wrapped = (...args) => {
        call.invoke(args, { methodName: 'on', event })
        listener(...args)
      }
      super.on(event, wrapped)
      return this
    }
    send(message, options?, cb?) {
      const call = this.__komondor.instance.newCall()
      call.invoke([message, options, cb], { methodName: 'send' })
      super.send(message, options, cb)
    }
    terminate() {
      const call = this.__komondor.instance.newCall()
      call.invoke([], { methodName: 'terminate' })
      super.terminate()
    }
  }
}
