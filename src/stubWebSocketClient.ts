import { StubContext, StubCall } from 'komondor-plugin'
import WebSocket, { ClientOptions } from 'ws'

import { createFakeClientBase } from './createFakeClientBase'

export function stubWebSocketClient(context: StubContext, subject: typeof WebSocket): Partial<typeof WebSocket> {
  return class WebSocketClientStub extends createFakeClientBase(subject) {
    // tslint:disable-next-line:variable-name
    __komondor: any = { listeners: {} }
    constructor(address: string, options?: ClientOptions) {
      super()
      this.__komondor.instance = context.newInstance([address, options], { className: 'WebSocket' })
    }
    on(event: string, listener) {
      const call: StubCall = this.__komondor.instance.newCall({ methodName: 'on' })
      call.invoked([event, listener])
      call.result()
      return this
    }
    send(message, options?, cb?) {
      const call = this.__komondor.instance.newCall({ methodName: 'send' })
      call.invoked([message, options, cb])
      call.result()
    }
    terminate() {
      const call = this.__komondor.instance.newCall({ methodName: 'terminate' })
      call.invoked([])
      call.result()
    }
  }
}
