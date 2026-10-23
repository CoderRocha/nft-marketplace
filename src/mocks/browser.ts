import { setupWorker } from 'msw/browser'
import { http, HttpResponse } from 'msw'

export const worker = setupWorker(
  http.get('*/health', () => HttpResponse.json({ ok: true })),
)