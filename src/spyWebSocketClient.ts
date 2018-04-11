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
      const call = this.__komondor.instance.newCall({ methodName: 'on' })
      const spiedArgs = call.invoke([event, listener])
      const result = super.on(...spiedArgs)
      call.return(undefined)
      return result
    }
    send(message, options?, cb?) {
      const call = this.__komondor.instance.newCall({ methodName: 'send' })
      const spiedArgs = call.invoke([message, options, cb])
      super.send(...spiedArgs)
      call.return(undefined)
      return this
    }
    terminate() {
      const call = this.__komondor.instance.newCall({ methodName: 'terminate' })
      call.invoke([])
      super.terminate()
      call.return(undefined)
    }
  }
}
