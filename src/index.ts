import { Registrar } from 'komondor-plugin'
import WebSocket from 'ws'

import { TYPE } from './constants'
import { spyWebSocketClient } from './spyWebSocketClient'
import { stubWebSocketClient } from './stubWebSocketClient'

export function webSocketConstructed(url?: string, options?) {
  return { type: TYPE, name: 'construct', payload: [url, options], meta: { className: 'WebSocket' } }
}

export function webSocketMethodInvoked(methodName: string, ...args: any[]) {
  return { type: TYPE, name: 'invoke', payload: args, meta: { methodName } }
}

export function webSocketMethodReturned(methodName?: string) {
  return { type: TYPE, name: 'return', meta: { methodName } }
}

export function activate(registrar: Registrar) {
  registrar.register(
    TYPE,
    isWebSocketClient,
    spyWebSocketClient,
    stubWebSocketClient
  )
}

function isWebSocketClient(subject): subject is typeof WebSocket {
  return subject && subject.name === 'WebSocket' &&
    subject.CONNECTING === 0 &&
    subject.OPEN === 1 &&
    subject.CLOSING === 2 &&
    subject.CLOSED === 3 &&
    subject.Server && subject.Server.name === 'WebSocketServer' &&
    subject.Receiver && subject.Receiver.name === 'Receiver' &&
    subject.Sender && subject.Sender.name === 'Sender'
}

