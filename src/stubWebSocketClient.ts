import { StubContext, SimulationMismatch } from 'komondor-plugin'
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
      this.__komondor.ctorArgs = [address, options]
      const instance = this.__komondor.instance = context.newInstance([address, options], { className: 'WebSocket' })
      this.__komondor.call = instance.newCall()
      setImmediate(() => {
        this.emitNextActions()
      })
    }
    emitNextActions() {
      const call = this.__komondor.call
      let action = call.peek()
      while (action && isWSEventAction(action)) {
        call.next()
        const listeners = this.__komondor.listeners[action.meta.event]
        if (listeners) {
          listeners.forEach(l => l(...action.payload))
        }
        action = call.peek()
      }
    }
    on(event: string, listener) {
      const listeners = this.__komondor.listeners
      if (!listeners[event])
        listeners[event] = []
      listeners[event].push(listener)
      return this
    }
    send(message, options?, cb?) {
      const call = this.__komondor.call
      const action = call.peek()

      if (!action || action.type !== 'ws' || action.meta.methodName !== 'send' || action.payload[0] !== message) {
        throw new SimulationMismatch(context.specId, { type: 'ws', payload: [message, options], meta: { methodName: 'send' } }, action)
      }
      call.next()
      this.emitNextActions()
    }
    terminate() {
      const call = this.__komondor.call
      const action = call.peek()
      if (!action || action.type !== 'ws' || action.meta.methodName !== 'terminate') {
        throw new SimulationMismatch(context.specId, { type: 'ws', meta: { methodName: 'send' } }, action)
      }
      call.next()
      this.emitNextActions()
    }
  }
}
