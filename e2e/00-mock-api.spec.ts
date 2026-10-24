import { expect } from '@playwright/test'
import * as v from 'valibot'
import { authResultSchema } from '@contracts/auth'
import { nftDetailSchema, nftHighlightsSchema, nftPageSchema } from '@contracts/nft'
import { problemSchema } from '@contracts/problem'
import { compareEth } from '@core/money'
import { test } from './fixtures'

test.describe('API simulada pelo MSW', () => {
  test('catálogo combina busca, filtros, ordenação e paginação', async ({ mocks }) => {
    await mocks.boot()
    const all = v.parse(nftPageSchema, (await mocks.api({ method: 'GET', path: '/nfts' })).body)
    expect(all.total).toBe(48)
    expect(all.items).toHaveLength(9)

    const combined = v.parse(nftPageSchema, (await mocks.api({ method: 'GET', path: '/nfts?colecao=musica&rede=polygon' })).body)
    expect(combined.items.map((nft) => nft.id)).toContain('golden-beat-207')
    expect(combined.items.every((nft) => nft.collection === 'musica' && nft.network === 'polygon')).toBe(true)

    const accentless = v.parse(nftPageSchema, (await mocks.api({ method: 'GET', path: '/nfts?q=musica&porPagina=24' })).body)
    expect(accentless.total).toBeGreaterThan(0)

    const cheapest = v.parse(nftPageSchema, (await mocks.api({ method: 'GET', path: '/nfts?ordem=menor-preco' })).body)
    const prices = cheapest.items.map((nft) => nft.price)
    expect(prices).toEqual([...prices].sort(compareEth))

    const ranged = v.parse(nftPageSchema, (await mocks.api({ method: 'GET', path: '/nfts?precoMin=1&precoMax=1.5&porPagina=24' })).body)
    expect(ranged.items.every((nft) => compareEth(nft.price, '1') >= 0 && compareEth(nft.price, '1.5') <= 0)).toBe(true)

    const beyond = v.parse(nftPageSchema, (await mocks.api({ method: 'GET', path: '/nfts?pagina=99' })).body)
    expect(beyond).toMatchObject({ items: [], total: 48 })

    const invalid = await mocks.api({ method: 'GET', path: '/nfts?colecao=inexistente' })
    expect(invalid.status).toBe(422)
  })

  test('detalhe existe, edição esgotada e NFT inexistente', async ({ mocks }) => {
    await mocks.boot()
    const detail = v.parse(nftDetailSchema, (await mocks.api({ method: 'GET', path: '/nfts/emerald-ape-042' })).body)
    expect(detail.price).toBe('1.19')
    expect(detail.editions.find((edition) => edition.id === '1-1')?.available).toBe(0)

    const missing = await mocks.api({ method: 'GET', path: '/nfts/nao-existe-000' })
    expect(missing.status).toBe(404)
    expect(v.parse(problemSchema, missing.body).code).toBe('not_found')
  })

  test('cenário de erro 503 falha três vezes e recupera', async ({ mocks }) => {
    await mocks.boot('padrao', '/nfts/nao-existe-000')
    await mocks.scenario('erro-503')
    const statuses = []
    for (let attempt = 0; attempt < 4; attempt += 1) statuses.push((await mocks.api({ method: 'GET', path: '/nfts' })).status)
    expect(statuses).toEqual([503, 503, 503, 200])
  })

  test('catálogo vazio não tem destaques', async ({ mocks }) => {
    await mocks.boot('vazio')
    const page = v.parse(nftPageSchema, (await mocks.api({ method: 'GET', path: '/nfts' })).body)
    expect(page.total).toBe(0)
    const highlights = v.parse(nftHighlightsSchema, (await mocks.api({ method: 'GET', path: '/nfts/highlights' })).body)
    expect(highlights).toEqual({ hero: [], featured: null })
  })

  test('login, sessão, conflito de cadastro e expiração', async ({ mocks }) => {
    await mocks.boot()
    const wrong = await mocks.api({ method: 'POST', path: '/auth/login', body: { email: 'ana@kurio.dev', password: 'errada' } })
    expect(wrong.status).toBe(401)

    const login = await mocks.api({ method: 'POST', path: '/auth/login', body: { email: 'ana@kurio.dev', password: 'Senha@123' } })
    const { token, user } = v.parse(authResultSchema, login.body)
    expect(user.email).toBe('ana@kurio.dev')
    expect((await mocks.api({ method: 'GET', path: '/auth/session', token })).status).toBe(200)

    const conflict = await mocks.api({
      method: 'POST',
      path: '/auth/register',
      body: { username: 'novo.usuario', email: 'ocupado@kurio.dev', password: 'Senha@123' },
    })
    expect(conflict.status).toBe(409)
    expect(v.parse(problemSchema, conflict.body)).toMatchObject({ code: 'email_taken', errors: { email: [expect.any(String)] } })

    await mocks.api({ method: 'POST', path: '/__mocks/session/expire', token })
    const expired = await mocks.api({ method: 'GET', path: '/auth/session', token })
    expect(expired.status).toBe(401)
    expect(v.parse(problemSchema, expired.body).code).toBe('session_expired')
  })
})
