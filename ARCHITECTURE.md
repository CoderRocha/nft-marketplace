# Arquitetura

Este documento descreve como o Kurio está organizado, os contratos entre interface e API, as políticas de sessão, carrinho, cache e tempo real, e as decisões e desvios em relação ao Figma. Instruções de execução estão no [README](README.md).

## Camadas

O código fica em `src/`, dividido por responsabilidade. O `eslint-plugin-boundaries` impede imports que quebrem a tabela abaixo, e as regras de lint proíbem barrel files, classes, asserções de tipo (`as`) e imports relativos entre módulos.

| Camada | Papel | Pode importar |
| --- | --- | --- |
| `contracts` | Schemas Valibot e tipos dos dados trocados com a API. Fonte única para app e mocks. | `contracts` |
| `core` | Cliente HTTP, funções de API, query keys e options, sessão, tempo real, dinheiro, armazenamento do checkout. | `core`, `contracts`, `mocks` |
| `ui` | Componentes shadcn/ui (base-nova sobre Base UI), sem domínio nem texto fixo. | `ui` |
| `pattern` | Peças compostas reutilizáveis: formulários, estados de erro, carrossel, stepper, "Em breve". | `core`, `ui`, `pattern` |
| `layouts` | Estruturas visuais puras: loja (header, rodapé, barra mobile), perfil, recibo. | `core`, `ui`, `pattern`, `layouts` |
| `features` | Funcionalidades: catálogo, NFT, favoritos, carrinho, checkout, pedidos, autenticação, perfil, carteiras. | `core`, `ui`, `pattern`, `features`, `contracts` |
| `routes` | Rotas finas: guard, search params validados, prefetch e composição. | `core`, `ui`, `pattern`, `layouts`, `features` |
| `mocks` | MSW: banco simulado, fixtures, handlers REST, Socket.IO, cenários e controles. | `core`, `mocks`, `contracts` |

Fluxo de um recurso: schema em `contracts` → função em `core/api` (Axios, valida a resposta com o schema) → chave em `core/keys` → `queryOptions` em `core/queries` → rota faz prefetch e a feature lê com `useQuery` → handler em `mocks` valida a entrada com o mesmo schema.

## Contratos REST

Base `/api`. Requisições autenticadas enviam `Authorization: Bearer <token>`. Visitantes enviam `X-Cart-Id: <uuid>` para identificar o carrinho anônimo. Valores em ETH trafegam como strings decimais (`^\d+(\.\d{1,18})?$`) e quantidades como inteiros.

### Erros

Todos os erros usam `application/problem+json`:

```json
{ "type": "https://kurio.dev/problemas/quote_outdated", "title": "...", "status": 409, "detail": "...", "code": "quote_outdated", "errors": { "campo": ["mensagem"] } }
```

| Código | Status | Uso |
| --- | --- | --- |
| `validation_error` | 422 | Corpo ou parâmetros inválidos; `errors` traz a mensagem por campo, que o formulário mostra no campo certo. |
| `unauthenticated` | 401 | Sem token ou credenciais incorretas. |
| `session_expired` | 401 | Token expirado ou inexistente. |
| `forbidden` | 403 | Pedido de outra conta. |
| `not_found` | 404 | NFT, pedido ou item inexistente. |
| `email_taken`, `username_taken` | 409 | Conflito de cadastro ou de edição de perfil. |
| `availability_conflict` | 409 | Edição esgotada, quantidade acima do disponível ou carrinho vazio. |
| `quote_outdated` | 409 | Preço, disponibilidade, cupom ou taxa mudaram desde a revisão; inclui `quote` com a cotação nova. |
| `wallet_rejected` | 409 | Carteira recusou a conexão ou foi desconectada. |
| `coupon_invalid`, `coupon_expired` | 422 | Cupom inexistente ou expirado. |
| `idempotency_conflict` | 422 | Mesma `Idempotency-Key` com corpo diferente. |
| `transient` | 503 | Falha transitória; inclui `Retry-After`. |
| `internal` | 500 | Falha do servidor. |

No cliente, toda falha vira um `FriendlyError` (`status`, `code`, `title`, `detail`, `fieldErrors`, `retryAfterMs`, `payload`), inclusive timeout (`code: timeout`), queda de rede (`network_error`) e resposta fora do contrato (`invalid_response`).

### Recursos

| Recurso | Método e rota | Corpo ou parâmetros | Resposta |
| --- | --- | --- | --- |
| Sessão | `POST /auth/register` | `{ username, email, password }` | `201 { token, expiresAt, user }`; mescla o carrinho do visitante |
| | `POST /auth/login` | `{ email, password }` | `{ token, expiresAt, user }`; mescla o carrinho do visitante |
| | `GET /auth/session` | | `{ user, expiresAt }` |
| | `POST /auth/logout` | | `204` |
| NFTs | `GET /nfts` | `q, aba, colecao[], rede[], precoMin, precoMax, ordem, pagina, porPagina` | `{ items, total, page, pageSize, facets: { collections, networks, priceRange } }` |
| | `GET /nfts/highlights` | | `{ hero: NftSummary[], featured: NftSummary \| null }` |
| | `GET /nfts/:id` | | `NftDetail` (edições, galeria, atributos, avaliações, `version`) |
| | `GET /nfts/:id/related` | | `NftSummary[]` |
| Favoritos | `GET /me/favorites` | | `{ items: NftSummary[] }` |
| | `PUT` e `DELETE /me/favorites/:nftId` | | `{ nftId, favorite }` |
| Carrinho | `GET /cart` | | `Cart` (linhas com o estado atual do NFT e da edição, `acceptedPrice`, `couponCode`, `itemCount`, `updatedAt`) |
| | `POST /cart/items` | `{ nftId, editionId, quantity }` | `201 Cart` |
| | `PATCH /cart/items/:lineId` | `{ quantity?, acceptPrice? }` | `Cart` |
| | `DELETE /cart/items/:lineId` | | `Cart` |
| | `PUT` e `DELETE /cart/coupon` | `{ code }` | `Cart` |
| Cotação | `POST /quotes` | | `{ id, version, coupon, subtotal, discount, networkFee, total, itemCount, issues[], createdAt, expiresAt }` |
| Pedidos | `POST /orders` | header `Idempotency-Key`; `{ quoteId, quoteVersion, connectionId, walletSource, collector }` | `201 Order`, ou `200 Order` com `Idempotent-Replayed: true` |
| | `GET /orders/:orderId` | | `Order` (estado e snapshot do recibo) |
| | `GET /orders` | `status?` | `Order[]` |
| Carteira conectada | `POST /wallet-connections` | `{ provider, network, address }` | `201 WalletConnection` |
| | `DELETE /wallet-connections/:id` | | `204` |
| Perfil | `GET` e `PATCH /me/profile` | `{ displayName, username, email, ensName, walletNickname }` | `Profile` |
| | `PUT /me/avatar` | multipart `avatar` (PNG, JPG ou WebP até 1 MB) | `Profile` |
| | `DELETE /me/avatar` | | `Profile` |
| | `PUT /me/password` | `{ currentPassword, newPassword }` | `204` |
| Carteiras | `GET /me/wallets` | | `{ primary, secondary }` |
| | `PUT /me/wallets/:role` | `primary` ou `secondary`; campos da carteira | `Wallet` |
| Newsletter | `POST /newsletter` | `{ email }` | `201` |

Controles exclusivos do mock (sem latência): `GET /__mocks/state`, `PUT /__mocks/scenario`, `POST /__mocks/reset`, `POST /__mocks/failures`, `POST /__mocks/session/expire`, `POST /__mocks/nfts/:nftId/update`, `POST /__mocks/realtime/drop`, `POST /__mocks/realtime/replay`.

## Eventos em tempo real

Todo evento traz um envelope comum e é validado no cliente com o schema de `contracts/events.ts`:

```json
{
  "eventId": "evt_6a1f...",
  "type": "nft.updated",
  "resource": { "type": "nft", "id": "emerald-ape-042" },
  "version": 3,
  "userId": null,
  "occurredAt": "2026-10-24T12:00:00.000Z",
  "data": { "nft": { "...": "NftSummary" }, "editions": [] }
}
```

| Evento | Destino | Dados | Efeito no cliente |
| --- | --- | --- | --- |
| `nft.updated` | Todos (`userId: null`) | Estado novo do NFT e das edições | Atualiza detalhe, listas e favoritos; se o NFT está no carrinho, recarrega carrinho e cotação e avisa a mudança. Com o detalhe aberto (e o NFT fora do carrinho), avisa a mudança de preço ou o esgotamento da edição. |
| `order.updated` | Só o dono do pedido | Pedido completo | Atualiza o pedido; ao chegar a estado final, recarrega carrinho, cotação e catálogo e limpa a tentativa de checkout. |

No mock, toda alteração de NFT (controle de teste, cenários de checkout, baixa de estoque na confirmação) e toda confirmação ou recusa de pedido passa por uma única função que grava no banco e publica o evento. Assim REST e eventos nunca divergem.

## Transporte do Socket.IO nos mocks

O servidor Socket.IO é simulado com `ws.link` do MSW mais `@mswjs/socket.io-binding`, que codifica e decodifica o protocolo Engine.IO e Socket.IO. O app usa o `socket.io-client` real, sem atalhos.

Detalhes e limitações:

- **Só WebSocket:** o MSW intercepta WebSocket, não long-polling. O cliente usa `transports: ['websocket']`.
- **Ordem de carregamento:** o `engine.io-client` guarda o construtor `WebSocket` ao ser avaliado. Por isso o `socket.io-client` só é importado de forma dinâmica depois de o worker do MSW iniciar (`core/realtime.ts`), e uma regra de lint proíbe o import estático.
- **URL do handler:** o MSW 3 remove o prefixo `/socket.io/` antes de comparar, então o `ws.link` aponta para a origem da página.
- **Heartbeat:** o handshake simulado anuncia `pingInterval` de 25 s. Sem ping, o cliente cairia a cada 30 s; o mock envia o ping do Engine.IO a cada 10 s.
- **Sem rooms nem namespaces:** o binding não implementa esses recursos. O mock associa cada conexão ao usuário do token (enviado na query string do handshake, porque o binding não expõe o payload `auth`) e filtra os destinatários manualmente.
- **Sem connection state recovery:** o `sid` é fixo e `socket.recovered` é sempre falso. Por isso o cliente sempre reconcilia com a API REST ao reconectar.
- **Compatibilidade de versão:** o binding declara peer `msw@^2`; um `overrides` no `package.json` permite usá-lo com o MSW 3. Em runtime ele só usa `engine.io-parser` e `socket.io-parser`, e o teste `e2e/unit/realtime-transport.unit.ts` cobre handshake, eventos nos dois sentidos, queda, reconexão e heartbeat.

## Sessão

- **Token:** opaco, emitido pelo mock e guardado no `localStorage`. O Axios envia o token em todas as chamadas. Duração de 2 h (45 s no cenário `sessao-expirada`).
- **Recuperação após refresh:** a query de sessão (`staleTime: Infinity`) consulta `GET /auth/session` se houver token; um 401 apaga o token e devolve "sem sessão".
- **Rotas privadas:** checkout, perfil, carteiras, favoritos e pedidos passam por um único guard (`requireSession`), que redireciona ao login com `redirect` para a rota original. Após o login, o usuário volta ao destino.
- **Expiração durante a navegação:** qualquer 401 de uma chamada que levava token encerra a sessão. Se a página atual é privada, o app leva ao login com `redirect` e `motivo=expirada`; em página pública, só avisa. O rascunho do formulário de pagamento é salvo por usuário no `sessionStorage` a cada mudança e volta ao retornar com o mesmo usuário.
- **Logout e troca de usuário:** cancelam e removem do cache tudo que é privado (perfil, carteiras, favoritos, pedidos, carrinho e cotação), descartam o id de carrinho de visitante e fecham o socket, que reconecta com o token novo. As chaves de dados privados incluem o `userId`, e o cliente ignora eventos cujo `userId` não é o da sessão atual.
- **Senhas:** o mock guarda apenas hash SHA-256 com salt; nenhuma senha é guardada no cliente.

## Carrinho

- **No servidor (mock), para visitante e usuário:** o visitante recebe um id anônimo, guardado no `localStorage` e enviado em `X-Cart-Id`. O carrinho sobrevive a refresh.
- **Mescla no login:** login e cadastro com `X-Cart-Id` mesclam os itens do visitante no carrinho da conta, respeitando a disponibilidade de cada edição. Depois o id anônimo é descartado; um logout começa com carrinho vazio.
- **Disponibilidade:** adicionar ou aumentar respeita o estoque de cada edição e o limite de 10 unidades por pedido. Excesso retorna `availability_conflict`.
- **Preço aceito:** cada linha guarda o `acceptedPrice`, o preço que o usuário viu ao adicionar. Ele só muda por ação do usuário ("Aceitar novo preço").
- **Cotação:** o resumo vem sempre de `POST /quotes`, calculado em wei:
  - Subtotal com os preços atuais.
  - Desconto do cupom ativo.
  - Taxa de rede somada por rede distinta dos itens (Ethereum 0,016, Polygon 0,002, Solana 0,0008).
  - Pendências por linha: `price_changed` (preço atual diferente do aceito), `insufficient` e `sold_out`.
  - A `version` é um hash de itens, preços, disponibilidade, cupom, taxa e pendências.
- **Bloqueio:** enquanto houver pendência, "Conectar e finalizar" fica bloqueado.

## Pedido

- **Revalidação:** "Confirmar compra" busca uma cotação nova e abre a revisão. No envio, o servidor recalcula a cotação; se a versão mudou ou há pendências, responde `quote_outdated` com a cotação nova. Mudança só de preço exige "Aceitar novos valores" (atualiza o `acceptedPrice`) e nova confirmação; edição esgotada leva ao carrinho.
- **Idempotência:** cada tentativa tem uma chave (`crypto.randomUUID`) associada ao hash do corpo e guardada por usuário no `sessionStorage`. Mesmo corpo reaproveita a chave e um corpo novo gera outra. O servidor devolve o mesmo pedido para a mesma chave e corpo, e responde `idempotency_conflict` para a mesma chave com corpo diferente.
- **Clique duplo e timeout:** o botão fica desabilitado durante o envio. Em timeout (8 s), queda de rede ou erro 5xx, o cliente reenvia com a mesma chave até 3 vezes, mostrando "Verificando o pedido".
- **Estados:** o pedido nasce `pending` e é resolvido para `confirmed` ou `declined` 2,5 s depois. A resolução acontece por horário (`settleAt`) e também é verificada em toda leitura, então refresh, troca de aba ou reconexão sempre encontram o estado correto. Estados finais nunca regridem.
- **Retomada:** abrir `/checkout` com uma tentativa pendente salva leva direto ao pedido, sem permitir outra compra.
- **Recibo:** só aparece para `confirmed`, montado do snapshot gravado no pedido (itens, preços, desconto, taxa, total, carteira e transação simulada). Mudanças posteriores no catálogo não alteram o recibo.
- **Carrinho após o pedido:** na confirmação, o servidor baixa o estoque e tira do carrinho só os itens e quantidades comprados; em recusa, nada sai do carrinho.

## Cache, retries e sincronização

| Dado | Política |
| --- | --- |
| Padrão | `staleTime` de 30 s. |
| Lista do catálogo | `placeholderData: keepPreviousData`, para manter a lista anterior esmaecida enquanto a nova carrega. |
| Sessão | `staleTime: Infinity`; atualizada por login, logout e expiração. |
| Cotação | `staleTime: 0`; a chave inclui a `updatedAt` do carrinho, então qualquer mudança no carrinho gera cotação nova. |
| Pedido pendente | Consulta a cada 5 s como fallback; o evento `order.updated` atualiza na hora. |

- **Retries de leitura:** até 2 tentativas extras, só para falha de rede, timeout e 5xx. Respeitam `Retry-After` ou usam backoff exponencial de até 8 s. Erros 4xx e respostas fora do contrato não são repetidos.
- **Falha em segundo plano:** se um refetch falha e a tela já tem dados (polling do pedido, reconciliação após reconexão, foco da janela), os dados continuam visíveis e o refetch seguinte recupera. O estado de erro com "Tentar novamente" só aparece quando a primeira carga falha (`isLoadingError`).
- **Mutations:** sem retry automático. O único reenvio é o do pedido, com a mesma chave de idempotência.
- **Atualização otimista com rollback:** favoritar e desfavoritar, quantidade no carrinho e remoção de item. Em erro, o estado anterior volta e a mensagem do servidor aparece.
- **Respostas obsoletas:** o `AbortSignal` do TanStack Query é repassado ao Axios, e cada combinação de filtros tem chave própria. Uma resposta antiga nunca substitui a mais recente (há teste para o cenário `fora-de-ordem`).
- **Invalidação:** mutations de carrinho e cupom gravam no cache o carrinho devolvido; perfil e carteiras gravam a resposta; eventos e pedidos finalizados invalidam carrinho, cotação e catálogo.
- **URL como estado:** busca, filtros, aba, ordem e página do catálogo vivem na URL e sobrevivem a refresh e ao histórico. Busca digitada no mobile usa `replace` com debounce de 300 ms; filtros e paginação usam `push`; qualquer filtro volta à página 1.

## Reconciliação entre REST e Socket.IO

1. **Versão por recurso:** NFTs e pedidos têm `version` incremental, igual na REST e nos eventos.
2. **Filtro de eventos:** o cliente descarta `eventId` já visto (duplicado) e versão menor ou igual à última aplicada para o mesmo recurso (evento antigo). Nenhum efeito, incluindo avisos, é reaplicado.
3. **Aplicação condicional:** um evento só altera o cache se for mais novo que o dado em cache. Pedidos em estado final ignoram eventos.
4. **Reconexão:** ao reconectar, o cliente invalida NFTs, carrinho, cotação e pedidos que estão na tela, buscando na API o que mudou durante a queda. A interface avisa "Conexão em tempo real perdida" e "restabelecida".
5. **Ciclo de vida:** o socket abre depois dos mocks, é recriado na troca de usuário e fechado no logout. Listeners são removidos no cleanup.
6. **Aviso de mudança no carrinho:** compara o preço novo com o `acceptedPrice`, que é estável. Comparar com o cache perdia avisos quando dois eventos chegavam em sequência rápida.

## Valores em ETH

Todo cálculo usa `bigint` em wei (18 casas) em `core/money.ts`: soma, subtração, multiplicação por quantidade, percentual e comparação. Nenhum `number` participa de cálculo monetário. A formatação mostra no mínimo duas casas (`1.19 ETH`, `0.016 ETH`, `(-) 0.00`).

## Decisões de UX

- **Breakpoints:**
  - Abaixo de 768 px: layout mobile com barra inferior.
  - De 768 px a 1024 px: header desktop com filtros numa gaveta.
  - Acima de 1024 px: sidebar de filtros.
  - Detalhe, carrinho, pagamento, login e cadastro escondem a barra inferior no mobile, como no Figma.
- **"Mercado":** fica ativo em detalhe, carrinho e pagamento e leva à seção do catálogo no Início.
- **Login e cadastro:** são rotas próprias (acesso direto e `redirect` funcionam). No desktop aparecem como diálogo sobre o Início inerte, como no Figma; no mobile, como página inteira.
- **Pagamento:** página única no desktop; no mobile, duas etapas (dados do colecionador e "Pagamento com carteira").
- **Revisão:** o diálogo de revisão antes do envio não está no Figma; foi incluído porque o enunciado pede revisão antes de enviar.
- **Carteira e provedor:** a carteira cadastrada (Principal, Reserva ou outra) define endereço e rede; o provedor (MetaMask, WalletConnect, Coinbase Wallet) é a conexão simulada.
- **Confirmação:** é uma rota própria (`/orders/:id`) com o card do Figma; pendente e recusado usam o mesmo card.
- **Favoritos:** a "Lista de interesse" do perfil é a tela de favoritos; o coração da barra mobile leva a ela.
- **Botões do detalhe e do card:**
  - "Comprar" adiciona ao carrinho e vai para ele.
  - O botão de carrinho (mobile e hover do card) só adiciona, com aviso e o atalho "Ver carrinho".
- **Botão central da barra mobile:** abre a busca, já que o ícone de leitor do Figma não tem fluxo no escopo.
- **Itens fora do escopo:** Criadores, Aprenda, Atividade, Ofertas, Arquivos baixados, Suporte, Central de ajuda, Minha coleção, Estúdio do criador e "Esqueceu a senha?" aparecem com `aria-disabled` e o aviso "Em breve".
- **Login social:** Google e Facebook avisam que estão indisponíveis na demonstração.
- **Explorador de blocos:** "Ver no Etherscan" abre um aviso de transação simulada com o hash copiável.
- **Links externos:** compartilhar usa URLs reais de compartilhamento (LinkedIn, X, e-mail); contato usa `mailto:` e `tel:`; redes sociais abrem em nova aba.
- **Newsletter:** tem um endpoint simulado próprio e confirmação real.
- **Perfil:** um único "Salvar", como no Figma; a senha só muda quando os campos de senha são preenchidos.
- **Avisos de mudança no carrinho:** ficam 10 s na tela, mais que os avisos comuns, para dar tempo de leitura.

## Desvios do Figma

- O título do resumo do carrinho é "Resumo do pedido"; no Figma está "Resumo da carteira", que parece engano.
- O carrinho desktop mostra a edição de cada linha, porque a disponibilidade é por edição.
- O seletor de carteira cadastrada aparece também no pagamento desktop; no Figma ele só aparece no mobile.
- Login e cadastro têm labels visíveis acima dos campos; no Figma os campos só têm placeholder.
- Medidas que não eram legíveis nos prints foram aproximadas a partir da grade de 1200 px do layout.

## Substituição de assets

- Todas as NFTs usam a mesma arte de exemplo (`design/exemplo-nft.png`), convertida para WebP em 320, 640 e 1024 px (`public/images/nfts/`, de 10 KB a 56 KB). As imagens individuais do Figma não foram exportadas.
- O logo "KURIO" é texto na fonte do layout.
- O ícone "Thank you" do recibo foi substituído pelo ícone `MailCheck` do Lucide.
- Ícones de marca (Google, Facebook, X, LinkedIn, Instagram, YouTube) vêm do `react-icons`; o Lucide 1.x não tem ícones de marca.
- A fonte Roboto Mono é servida pelo próprio app (`@fontsource-variable/roboto-mono`), sem depender do Google Fonts.

## Acessibilidade

- **Teclado e estrutura:**
  - Link "Pular para o conteúdo" e foco visível em todos os controles.
  - `aria-current` na navegação.
  - Edições como radios nativos.
  - Diálogos e gavetas prendem o foco e o devolvem ao elemento que os abriu.
- **Formulários:** erros associados aos campos por `aria-describedby`, com `aria-invalid` e `aria-required`. Erros da API aparecem no campo correspondente.
- **Avisos acessíveis:** mutations e eventos em tempo real geram avisos em região `aria-live` (toasts e resumos do carrinho); estados com texto ou ícone além da cor (edição esgotada riscada e com aviso, pendências do carrinho com texto).
- **Movimento:** skeletons com shimmer respeitam `prefers-reduced-motion`.
- **Ajustes em relação ao Figma:**
  - O tom de texto secundário usado nos metadados do Figma (`#8b724d`, contraste de cerca de 4,2:1) foi trocado pelo secundário geral (`#a0896b`, 5,7:1).
  - O botão da conta tem nome acessível com o nome do usuário, em vez das iniciais.
  - O botão "Conectar e finalizar" bloqueado usa cores de inativo com contraste suficiente, em vez de opacidade.
- **Verificação:** a varredura axe (WCAG 2.1 A e AA) roda nos testes para todas as telas principais, e a responsividade também é testada em 320 px de largura (equivalente a zoom de 400%).
- **Alvos de toque:** os pontos dos carrosséis têm área clicável de 24 px, mantendo o ponto visual do Figma.

## Performance

- O layout da loja e o Início ficam no bundle principal; as demais rotas são divididas automaticamente pelo TanStack Router.
- No build com mocks, um plugin do Vite adiciona `modulepreload` do chunk do MSW, para baixá-lo em paralelo com o JS principal.
- Imagens WebP com `srcset`, dimensões fixas e prioridade alta para as primeiras imagens; skeletons com as mesmas dimensões do conteúdo.
- Os devtools do TanStack só existem no desenvolvimento.

A análise do Lighthouse e a justificativa do resultado mobile estão no [README](README.md#performance-lighthouse).

## Limitações conhecidas

- A camada de mocks roda no navegador: cada aba tem sua própria instância do banco simulado, sincronizada apenas pelo `localStorage` ao recarregar.
- Eventos em tempo real só alcançam abas conectadas ao mesmo worker do MSW, ou seja, a própria aba.
- Transações, links de explorador e conexão de carteira são simulados; não há integração com blockchain, extensões de carteira ou gateways de pagamento.
- O `expiresAt` da cotação é informativo; a validade é garantida pela `version` revalidada no envio do pedido.
- Os baselines visuais foram gerados no Windows e dependem da renderização de fontes da plataforma.
- O deploy na Vercel está pendente.
