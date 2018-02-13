import { SpecContext, SpecPluginUtil, SimulationMismatch } from 'komondor'
import { createSatisfier } from 'satisfier'
import WebSocket = require('ws')
import { ClientOptions } from 'ws'

import { createFakeClientBase } from './createFakeClientBase'

export function stubWebSocketClient(context: SpecContext, util: SpecPluginUtil, subject: typeof WebSocket, id: string): Partial<typeof WebSocket> {
  return class WebSocketClientStub extends createFakeClientBase(subject) {
    // tslint:disable-next-line:variable-name
    __komondorStub: any = { listeners: {} }
    constructor(address: string, options?: ClientOptions) {
      super()
      this.__komondorStub.ctorArgs = [address, options]
      const action = context.peek()
      if (!action || !createSatisfier(action.payload).test(JSON.parse(JSON.stringify([address, options])))) {
        throw new SimulationMismatch(id, { type: 'ws/constructor', payload: [address, options] }, action)
      }
      else {
        context.next()
        setImmediate(() => {
          this.emitNextActions()
        })
      }
    }
    emitNextActions() {
      let action = context.peek()
      while (action && (action.type === 'ws/message' || action.type === 'ws/event')) {
        if (action.type === 'ws/message') {
          context.next()
          const listeners = this.__komondorStub.listeners[action.meta.event]
          if (listeners) {
            // tslint:disable-next-line
            listeners.forEach(l => l(action!.payload))
          }
        }
        if (action.type === 'ws/event') {
          context.next()
          const listeners = this.__komondorStub.listeners[action.meta.event]
          if (listeners) {
            // tslint:disable-next-line
            listeners.forEach(l => l(...action!.payload))
          }
        }
        action = context.peek()
      }
    }
    on(event: string, listener) {
      const listeners = this.__komondorStub.listeners
      if (!listeners[event])
        listeners[event] = []
      listeners[event].push(listener)
      return this
    }
    send(message, options?, cb?) {
      const action = context.peek()
      if (!action || action.type !== 'ws/send' || action.payload !== message) {
        throw new SimulationMismatch(id, { type: 'ws/send', payload: message }, action)
      }
      context.next()
      this.emitNextActions()
    }
    terminate() {
      const action = context.peek()
      if (!action || action.type !== 'ws/terminate') {
        throw new SimulationMismatch(id, 'ws/terminate', action)
      }
      context.next()
      this.emitNextActions()
    }
  }
}
