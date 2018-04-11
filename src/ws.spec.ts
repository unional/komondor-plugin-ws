import { AssertOrder } from 'assertron'
import { config, callbackInvoked } from 'komondor'
import { testTrio } from 'komondor-test'
import WebSocket from 'ws'

import * as wsPlugin from './index'
import { webSocketConstructed, webSocketMethodInvoked, webSocketMethodReturned } from '.'

config.registerPlugin(wsPlugin)

// Note that since `testTrio()` is making real call to the echo service
// If there are too many test ran, the echo service may reject the calls.
// If that happens, then I have to do something to reduce the calls during CI.

testTrio('open-terminate/success', (title, spec) => {
  test(title, async () => {
    const s = await spec(WebSocket)
    const ws = new s.subject('ws://html5rocks.websocket.org/echo')
    await new Promise(a => {
      ws.on('open', () => {
        ws.terminate()
        a()
      })
    })
    await s.satisfy([
      { ...webSocketConstructed('ws://html5rocks.websocket.org/echo'), instanceId: 1 },
      { ...webSocketMethodInvoked('on', 'open'), instanceId: 1, invokeId: 1 },
      { ...webSocketMethodReturned('on'), instanceId: 1, invokeId: 1 },
      { ...callbackInvoked(), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 1, sourcePath: [1] },
      { ...webSocketMethodInvoked('terminate'), instanceId: 1, invokeId: 2 },
      { ...webSocketMethodReturned('terminate'), instanceId: 1, invokeId: 2 }
    ])
  })
})

testTrio('ws/echoSingle/success', (title, spec) => {
  test(title, async () => {
    const s = await spec(WebSocket)
    const ws = new s.subject('ws://html5rocks.websocket.org/echo')

    const actionCount = new AssertOrder()

    ws.on('open', () => ws.send('Ping'))

    const order = new AssertOrder(2)
    ws.on('message', (data) => {
      expect(data).toBe('Ping')
      order.once(1)
      ws.terminate()
    })

    ws.on('close', () => order.once(2))

    await order.wait(2)

    await s.satisfy([
      { ...webSocketConstructed('ws://html5rocks.websocket.org/echo'), instanceId: 1 },
      { ...webSocketMethodInvoked('on', 'open'), instanceId: 1, invokeId: 1 },
      { ...webSocketMethodReturned('on'), instanceId: 1, invokeId: 1 },
      { ...webSocketMethodInvoked('on', 'message'), instanceId: 1, invokeId: 2 },
      { ...webSocketMethodReturned('on'), instanceId: 1, invokeId: 2 },
      { ...webSocketMethodInvoked('on', 'close'), instanceId: 1, invokeId: 3 },
      { ...webSocketMethodReturned('on'), instanceId: 1, invokeId: 3 },
      { ...callbackInvoked(), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 1, sourcePath: [1] },
      { ...webSocketMethodInvoked('send', 'Ping'), instanceId: 1, invokeId: 4 },
      { ...webSocketMethodReturned('send'), instanceId: 1, invokeId: 4 },
      { ...callbackInvoked('Ping'), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 2, sourcePath: [1] },
      { ...webSocketMethodInvoked('terminate'), instanceId: 1, invokeId: 5 },
      { ...webSocketMethodReturned('terminate'), instanceId: 1, invokeId: 5 },
      { ...callbackInvoked(1006), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 3, sourcePath: [1] }
    ])
    order.end()
    actionCount.end()
  })
})

testTrio('ws/echoMultiple/success', (title, spec) => {
  test(title, async () => {
    const s = await spec(WebSocket)
    const ws = new s.subject('ws://html5rocks.websocket.org/echo')

    const order = new AssertOrder(2)
    ws.on('open', () => {
      ws.send('Ping')
      ws.send('Ping 2')
      ws.send('Ping 3')
    })

    ws.on('message', (data) => order.exactly(1, 3))

    ws.on('close', () => order.once(2))
    await order.wait(1)
    ws.terminate()
    await order.end(300)

    await s.satisfy([
      { ...webSocketConstructed('ws://html5rocks.websocket.org/echo'), instanceId: 1 },
      { ...webSocketMethodInvoked('on', 'open'), instanceId: 1, invokeId: 1 },
      { ...webSocketMethodReturned('on'), instanceId: 1, invokeId: 1 },
      { ...webSocketMethodInvoked('on', 'message'), instanceId: 1, invokeId: 2 },
      { ...webSocketMethodReturned('on'), instanceId: 1, invokeId: 2 },
      { ...webSocketMethodInvoked('on', 'close'), instanceId: 1, invokeId: 3 },
      { ...webSocketMethodReturned('on'), instanceId: 1, invokeId: 3 },
      { ...callbackInvoked(), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 1, sourcePath: [1] },
      { ...webSocketMethodInvoked('send', 'Ping'), instanceId: 1, invokeId: 4 },
      { ...webSocketMethodReturned('send'), instanceId: 1, invokeId: 4 },
      { ...webSocketMethodInvoked('send', 'Ping 2'), instanceId: 1, invokeId: 5 },
      { ...webSocketMethodReturned('send'), instanceId: 1, invokeId: 5 },
      { ...webSocketMethodInvoked('send', 'Ping 3'), instanceId: 1, invokeId: 6 },
      { ...webSocketMethodReturned('send'), instanceId: 1, invokeId: 6 },
      { ...callbackInvoked('Ping'), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 2, sourcePath: [1] },
      { ...callbackInvoked('Ping 2'), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 2, sourcePath: [1] },
      { ...callbackInvoked('Ping 3'), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 2, sourcePath: [1] },
      { ...webSocketMethodInvoked('terminate'), instanceId: 1, invokeId: 7 },
      { ...webSocketMethodReturned('terminate'), instanceId: 1, invokeId: 7 },
      { ...callbackInvoked(1006), sourceType: 'ws', sourceInstanceId: 1, sourceInvokeId: 3, sourcePath: [1] }
    ])
  })
})
