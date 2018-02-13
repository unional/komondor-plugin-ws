import { AssertOrder } from 'assertron'
import { spec, registerPlugin, SimulationMismatch } from 'komondor'
import WebSocket from 'ws'

import * as wsPlugin from './index'

registerPlugin(wsPlugin)

test('simple open and terminate', async () => {
  const wsSpec = await spec(WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')
  await new Promise(a => {
    ws.on('open', () => {
      ws.terminate()
      a()
    })
  })

  await wsSpec.satisfy([
    { type: 'ws/constructor' },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/terminate' }
  ])
})

test('simple open and terminate (save)', async () => {
  const wsSpec = await spec.save('open-close/success', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')
  await new Promise(a => {
    ws.on('open', () => {
      ws.terminate()
      a()
    })
  })

  await wsSpec.satisfy([
    { type: 'ws/constructor' },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/terminate' }
  ])
})

test('simple open and terminate (simulate)', async () => {
  const wsSpec = await spec.simulate('open-close/success', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')
  await new Promise(a => {
    ws.on('open', () => {
      ws.terminate()
      a()
    })
  })

  await wsSpec.satisfy([
    { type: 'ws/constructor' },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/terminate' }
  ])
})

test('single message', async () => {
  const wsSpec = await spec(WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

  const actionCount = new AssertOrder()
  wsSpec.onAny(() => { actionCount.exactly(1, 6) })

  ws.on('open', () => { ws.send('Ping') })

  const order = new AssertOrder(2)
  ws.on('message', (data) => {
    expect(data).toBe('Ping')
    order.once(1)
    ws.terminate()
  })

  ws.on('close', () => { order.once(2) })
  await order.wait(2)

  await wsSpec.satisfy([
    { type: 'ws/constructor', payload: ['ws://html5rocks.websocket.org/echo'] },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/send', payload: 'Ping' },
    { type: 'ws/message', payload: 'Ping' },
    { type: 'ws/terminate' },
    { type: 'ws/event', meta: { event: 'close' } }
  ])
  order.end()
  actionCount.end()
})

test('single message save', async () => {
  const wsSpec = await spec.save('ws/echo/success', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

  const actionCount = new AssertOrder()
  wsSpec.onAny(() => { actionCount.exactly(1, 6) })

  ws.on('open', () => { ws.send('Ping') })

  const order = new AssertOrder(2)
  ws.on('message', (data) => {
    expect(data).toBe('Ping')
    order.once(1)
    ws.terminate()
  })

  ws.on('close', () => { order.once(2) })
  await order.wait(2)

  await wsSpec.satisfy([
    { type: 'ws/constructor', payload: ['ws://html5rocks.websocket.org/echo'] },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/send', payload: 'Ping' },
    { type: 'ws/message', payload: 'Ping' },
    { type: 'ws/terminate' },
    { type: 'ws/event', meta: { event: 'close' } }
  ])
  order.end()
  actionCount.end()
})

test('single message simulate', async () => {
  const wsSpec = await spec.simulate('ws/echo/success', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

  const actionCount = new AssertOrder()
  wsSpec.onAny(() => { actionCount.exactly(1, 6) })

  ws.on('open', () => { ws.send('Ping') })

  const order = new AssertOrder(2)
  ws.on('message', data => {
    expect(data).toBe('Ping')
    order.once(1)
    ws.terminate()
  })

  ws.on('close', () => { order.once(2) })
  await order.wait(2)
  order.end()
  actionCount.end()

  await wsSpec.satisfy([
    { type: 'ws/constructor', payload: ['ws://html5rocks.websocket.org/echo'] },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/send', payload: 'Ping' },
    { type: 'ws/message', payload: 'Ping' },
    { type: 'ws/terminate' },
    { type: 'ws/event', meta: { event: 'close' } }
  ])
})

test('multiple message', async () => {
  const wsSpec = await spec(WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

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

  await wsSpec.satisfy([
    {
      type: 'ws/constructor',
      payload: ['ws://html5rocks.websocket.org/echo']
    },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/send', payload: 'Ping' },
    { type: 'ws/send', payload: 'Ping 2' },
    { type: 'ws/send', payload: 'Ping 3' },
    {
      type: 'ws/message',
      payload: 'Ping',
      meta: { event: 'message' }
    },
    {
      type: 'ws/message',
      payload: 'Ping 2',
      meta: { event: 'message' }
    },
    {
      type: 'ws/message',
      payload: 'Ping 3',
      meta: { event: 'message' }
    },
    { type: 'ws/terminate' },
    {
      type: 'ws/event',
      payload: [1006, ''],
      meta: { event: 'close' }
    }
  ])
})

test('multiple message (save)', async () => {
  const wsSpec = await spec.save('ws/echo/multi', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

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

  await wsSpec.satisfy([
    {
      type: 'ws/constructor',
      payload: ['ws://html5rocks.websocket.org/echo']
    },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/send', payload: 'Ping' },
    { type: 'ws/send', payload: 'Ping 2' },
    { type: 'ws/send', payload: 'Ping 3' },
    {
      type: 'ws/message',
      payload: 'Ping',
      meta: { event: 'message' }
    },
    {
      type: 'ws/message',
      payload: 'Ping 2',
      meta: { event: 'message' }
    },
    {
      type: 'ws/message',
      payload: 'Ping 3',
      meta: { event: 'message' }
    },
    { type: 'ws/terminate' },
    {
      type: 'ws/event',
      payload: [1006, ''],
      meta: { event: 'close' }
    }
  ])
})

test('multiple message (simulate)', async () => {
  const wsSpec = await spec.simulate('ws/echo/multi', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

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

  await wsSpec.satisfy([
    {
      type: 'ws/constructor',
      payload: ['ws://html5rocks.websocket.org/echo']
    },
    { type: 'ws/event', meta: { event: 'open' } },
    { type: 'ws/send', payload: 'Ping' },
    { type: 'ws/send', payload: 'Ping 2' },
    { type: 'ws/send', payload: 'Ping 3' },
    {
      type: 'ws/message',
      payload: 'Ping',
      meta: { event: 'message' }
    },
    {
      type: 'ws/message',
      payload: 'Ping 2',
      meta: { event: 'message' }
    },
    {
      type: 'ws/message',
      payload: 'Ping 3',
      meta: { event: 'message' }
    },
    { type: 'ws/terminate' },
    {
      type: 'ws/event',
      payload: [1006, ''],
      meta: { event: 'close' }
    }
  ])
})

test('simulate on not existed will throw', async () => {
  const wsSpec = await spec.simulate('ws/echo/notExist', WebSocket)
  expect(() => new wsSpec.subject('ws://html5rocks.websocket.org/echo')).toThrowError(SimulationMismatch)
})

test('simulate on unexpected send will throw', async () => {
  const wsSpec = await spec.simulate('open-close/success', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

  await new Promise(a => {
    ws.on('open', a)
  })

  expect(() => ws.send('p')).toThrow(SimulationMismatch)
})


test('simulate on unexpected terminate will throw', async () => {
  const wsSpec = await spec.simulate('ws/echo/success', WebSocket)
  const ws = new wsSpec.subject('ws://html5rocks.websocket.org/echo')

  await new Promise(a => {
    ws.on('open', a)
  })

  expect(ws.terminate).toThrow(SimulationMismatch)
})
