import { toSocketIo } from '@mswjs/socket.io-binding'
import { expect, test } from '@playwright/test'
import { ws } from 'msw'
import { setupServer } from 'msw/node'

const ORIGIN = 'ws://localhost:3000'

const ENGINE_IO_PING = '2'

test('socket.io-client fala com o mock MSW: handshake, eventos, queda e reconexão', async () => {
  const tokens: Array<string | null> = []
  const server = setupServer(
    ws.link(ORIGIN).addEventListener('connection', (connection) => {
      tokens.push(new URL(connection.client.url).searchParams.get('token'))
      const io = toSocketIo(connection)
      io.client.on('ping-app', () => {
        io.client.emit('nft.updated', { eventId: `e${tokens.length}`, version: tokens.length })
      })
      if (tokens.length === 1) setTimeout(() => { connection.client.close() }, 50)
    }),
  )
  server.listen({ onUnhandledFrame: 'error' })
  const { io } = await import('socket.io-client')
  const { WebSocket: NativeWebSocketTransport } = await import('engine.io-client')
  const client = io(ORIGIN, {
    transports: [NativeWebSocketTransport],
    query: { token: 'sess_ana' },
    reconnectionDelay: 20,
    reconnectionDelayMax: 40,
  })
  const received: unknown[] = []
  const disconnects: string[] = []
  client.on('connect', () => client.emit('ping-app'))
  client.on('nft.updated', (payload: unknown) => received.push(payload))
  client.on('disconnect', (reason) => disconnects.push(reason))

  await expect.poll(() => received.length).toBe(2)
  expect(tokens).toEqual(['sess_ana', 'sess_ana'])
  expect(disconnects).toEqual(['transport close'])
  expect(received).toEqual([
    { eventId: 'e1', version: 1 },
    { eventId: 'e2', version: 2 },
  ])

  client.close()
  server.close()
})

test('o cliente responde ao ping do Engine.IO enviado pelo mock', async () => {
  const pongs: string[] = []
  const server = setupServer(
    ws.link(ORIGIN).addEventListener('connection', (connection) => {
      toSocketIo(connection)
      connection.client.addEventListener('message', (event) => {
        if (event.data === '3') pongs.push(event.data)
      })
      setTimeout(() => { connection.client.send(ENGINE_IO_PING) }, 20)
    }),
  )
  server.listen({ onUnhandledFrame: 'error' })
  const { io } = await import('socket.io-client')
  const { WebSocket: NativeWebSocketTransport } = await import('engine.io-client')
  const client = io(ORIGIN, { transports: [NativeWebSocketTransport], forceNew: true })

  await expect.poll(() => pongs.length).toBe(1)
  expect(client.connected).toBe(true)

  client.close()
  server.close()
})
