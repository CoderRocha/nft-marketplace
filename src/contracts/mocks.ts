import * as v from 'valibot'
import { ethAmountSchema } from '@contracts/money'
import { EDITION_IDS } from '@contracts/nft'

export const SCENARIOS = [
  { id: 'padrao', label: 'Padrão', description: 'Latência curta e todos os serviços respondendo.' },
  { id: 'vazio', label: 'Catálogo vazio', description: 'A busca de NFTs não retorna resultados.' },
  { id: 'lento', label: 'Rede lenta', description: 'Todas as respostas levam cerca de 2,5 segundos.' },
  { id: 'latencia-variavel', label: 'Latência variável', description: 'Respostas entre 0,2 e 2,2 segundos, em sequência reproduzível.' },
  { id: 'fora-de-ordem', label: 'Respostas fora de ordem', description: 'Buscas mais curtas (as mais antigas ao digitar) respondem depois das mais longas.' },
  { id: 'offline', label: 'Sem conexão', description: 'As três primeiras chamadas ao catálogo falham por rede, depois recupera.' },
  { id: 'erro-500', label: 'Erro 500', description: 'As três primeiras chamadas ao catálogo retornam 500, depois recupera.' },
  { id: 'erro-503', label: 'Erro 503', description: 'As três primeiras chamadas ao catálogo retornam 503 com Retry-After.' },
  { id: 'sessao-expirada', label: 'Sessão curta', description: 'Novas sessões expiram 45 segundos após o login.' },
  { id: 'preco-alterado-no-checkout', label: 'Preço alterado no checkout', description: 'O preço de um item do carrinho sobe ao revisar o pedido.' },
  { id: 'esgotado-no-checkout', label: 'Edição esgotada no checkout', description: 'Uma edição do carrinho esgota ao revisar o pedido.' },
  { id: 'timeout-pedido', label: 'Timeout do pedido', description: 'O pedido é criado, mas a primeira resposta chega depois do timeout.' },
  { id: 'pagamento-recusado', label: 'Pagamento recusado', description: 'A rede recusa o pagamento após a criação do pedido.' },
  { id: 'carteira-recusada', label: 'Carteira recusada', description: 'O provedor da carteira recusa a conexão.' },
] as const

export type ScenarioId = (typeof SCENARIOS)[number]['id']

export const SCENARIO_IDS = SCENARIOS.map((scenario) => scenario.id)

export const scenarioInputSchema = v.object({ scenario: v.picklist(SCENARIO_IDS) })

export const mockStateSchema = v.object({ scenario: v.picklist(SCENARIO_IDS) })

export type MockState = v.InferOutput<typeof mockStateSchema>

export const failureInputSchema = v.object({
  method: v.picklist(['get', 'post', 'put', 'patch', 'delete']),
  path: v.pipe(v.string(), v.startsWith('/')),
  kind: v.union([v.literal('offline'), v.literal('timeout'), v.pipe(v.number(), v.integer(), v.minValue(400), v.maxValue(599))]),
  times: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
})

export type FailureInput = v.InferOutput<typeof failureInputSchema>

export const nftUpdateInputSchema = v.object({
  editionId: v.picklist(EDITION_IDS),
  price: v.optional(ethAmountSchema),
  available: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
})

export type NftUpdateInput = v.InferOutput<typeof nftUpdateInputSchema>
