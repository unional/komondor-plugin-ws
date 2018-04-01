import a, { AssertOrder } from 'assertron'
import { spec, config } from 'komondor'
import { SimulationMismatch } from 'komondor-plugin'
import { testTrio } from 'komondor-test'
import WebSocket from 'ws'

import * as wsPlugin from './index'

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
      { type: 'ws', name: 'constructor' },
      { type: 'ws', name: 'invoke', meta: { methodName: 'on', event: 'open' } },
      { type: 'ws', name: 'invoke', meta: { methodName: 'terminate' } }
    ])
  })
})

testTrio('ws/echoSingle/success', (title, spec) => {
  test(title, async () => {
    const s = await spec(WebSocket)
    const ws = new s.subject('ws://html5rocks.websocket.org/echo')

    const actionCount = new AssertOrder()
    s.onAny(() => { actionCount.exactly(1, 6) })

    ws.on('open', () => { ws.send('Ping') })

    const order = new AssertOrder(2)
    ws.on('message', (data) => {
      expect(data).toBe('Ping')
      order.once(1)
      ws.terminate()
    })

    ws.on('close', () => { order.once(2) })
    await order.wait(2)

    await s.satisfy([
      { type: 'ws', name: 'constructor', payload: ['ws://html5rocks.websocket.org/echo'], instanceId: 1 },
      { type: 'ws', meta: { methodName: 'on', event: 'open' }, instanceId: 1, invokeId: 1 },
      { type: 'ws', payload: ['Ping'], meta: { methodName: 'send' }, instanceId: 1, invokeId: 4 },
      { type: 'ws', payload: ['Ping'], meta: { methodName: 'on', event: 'message' }, instanceId: 1, invokeId: 2 },
      { type: 'ws', meta: { methodName: 'terminate' }, instanceId: 1, invokeId: 5 },
      { type: 'ws', meta: { methodName: 'on', event: 'close' }, instanceId: 1, invokeId: 3 }
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
      {
        type: 'ws',
        name: 'constructor',
        payload: ['ws://html5rocks.websocket.org/echo'],
        instanceId: 1
      },
      {
        type: 'ws',
        meta: { methodName: 'on', event: 'open' },
        instanceId: 1, invokeId: 1
      },
      {
        type: 'ws',
        payload: ['Ping'],
        meta: { methodName: 'send' },
        instanceId: 1, invokeId: 4
      },
      {
        type: 'ws',
        payload: ['Ping 2'],
        meta: { methodName: 'send' },
        instanceId: 1, invokeId: 5
      },
      {
        type: 'ws',
        payload: ['Ping 3'],
        meta: { methodName: 'send' },
        instanceId: 1, invokeId: 6
      },
      {
        type: 'ws',
        payload: ['Ping'],
        meta: { methodName: 'on', event: 'message' },
        instanceId: 1, invokeId: 2
      },
      {
        type: 'ws',
        payload: ['Ping 2'],
        meta: { methodName: 'on', event: 'message' },
        instanceId: 1, invokeId: 2
      },
      {
        type: 'ws',
        payload: ['Ping 3'],
        meta: { methodName: 'on', event: 'message' },
        instanceId: 1, invokeId: 2
      },
      {
        type: 'ws',
        meta: { methodName: 'terminate' },
        instanceId: 1, invokeId: 7
      },
      {
        type: 'ws',
        payload: [1006, ''],
        meta: { methodName: 'on', event: 'close' },
        instanceId: 1, invokeId: 3
      }
    ])
  })
})

test('simulate on wrong constructor input will throw', async () => {
  const wsSpec = await spec.simulate('open-terminate/success', WebSocket)
  return a.throws(() => new wsSpec.subject('ws://wrongurl'), SimulationMismatch)
})

test('simulate on unexpected send will throw', async () => {
  const wsSpec = await spec.simulate('open-terminate/success', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

  await new Promise(a => {
    ws.on('open', a)
  })

  expect(() => ws.send('p')).toThrow(SimulationMismatch)
})

test('simulate without listen is fine', async () => {
  const s = await spec.simulate('ws/echoSingle/success', WebSocket)
  const ws = new s.subject('ws://html5rocks.websocket.org/echo')

  ws.on('open', () => {
    ws.send('Ping')
    ws.terminate()
  })

  const order = new AssertOrder(1)
  ws.on('close', () => { order.once(1) })
  await order.wait(1)
  order.end()
})

test('simulate on() same event multiple times', async () => {
  const s = await spec.simulate('ws/echoSingle/success', WebSocket)
  const ws = new s.subject('ws://html5rocks.websocket.org/echo')

  ws.on('open', () => {
    ws.send('Ping')
    ws.terminate()
  })
  const order = new AssertOrder(3)
  ws.on('message', () => { order.once(1) })
  ws.on('message', () => { order.once(2) })
  ws.on('close', () => { order.once(3) })
  await order.wait(3)
  order.end()
})

test('simulate on unexpected terminate will throw', async () => {
  const wsSpec = await spec.simulate('ws/echoSingle/success', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

  await new Promise(a => {
    ws.on('open', a)
  })

  expect(() => ws.terminate()).toThrow(SimulationMismatch)
})
