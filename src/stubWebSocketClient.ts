import { StubContext, SimulationMismatch, StubCall } from 'komondor-plugin'
import WebSocket, { ClientOptions } from 'ws'

import { TYPE } from './constants'
import { createFakeClientBase } from './createFakeClientBase'

function isWSEventAction(action) {
  return action.type === TYPE && action.meta.methodName === 'on'
}
export function stubWebSocketClient(context: StubContext, subject: typeof WebSocket): Partial<typeof WebSocket> {
  return class WebSocketClientStub extends createFakeClientBase(subject) {
    // tslint:disable-next-line:variable-name
    __komondor: any = { listeners: {} }
    constructor(address: string, options?: ClientOptions) {
      super()
      const instance = this.__komondor.instance = context.newInstance([address, options], { className: 'WebSocket' })
      const call = this.__komondor.call = instance.newCall()
      call.onAny(action => {
        if (isWSEventAction(action)) {
          call.invoked(action.payload, action.meta)
          const listeners = this.__komondor.listeners[action.meta.event]
          if (listeners) {
            listeners.forEach(l => l(...action.payload))
          }
        }
      })
    }
    on(event: string, listener) {
      const listeners = this.__komondor.listeners
      if (!listeners[event])
        listeners[event] = []
      listeners[event].push(listener)
      return this
    }
    send(message, options?, cb?) {
      const call: StubCall = this.__komondor.call
      call.invoked([message, options, cb], { methodName: 'send' })
    }
    terminate() {
      const call = this.__komondor.call
      call.invoked([], { methodName: 'terminate' })
    }
  }
}
