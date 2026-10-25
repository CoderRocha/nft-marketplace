# Arquitetura

Aqui explico como o código está organizado, os contratos com a API, como sessão, carrinho, pedido, cache e tempo real funcionam, e o que mudou em relação ao Figma. Para rodar o projeto, veja o [README](README.md).

---

## Camadas

O código fica em `src/`, separado por responsabilidade. O `eslint-plugin-boundaries` bloqueia imports que fujam da tabela abaixo. O lint também não deixa usar barrel files, classes, `as` nem imports relativos entre módulos.

| Camada | Para que serve | Pode importar |
| --- | --- | --- |
| `contracts` | Schemas Valibot e tipos dos dados da API, usados pelo app e pelos mocks | `contracts` |
| `core` | Axios, chamadas da API, query keys, sessão, tempo real e valores em ETH | `core`, `contracts`, `mocks` |
| `ui` | Componentes do shadcn/ui, sem regra de negócio | `ui` |
| `pattern` | Peças reutilizáveis: formulários, erro, carrossel, stepper, "Em breve" | `core`, `ui`, `pattern` |
| `layouts` | Layouts da loja, do perfil e do recibo | `core`, `ui`, `pattern`, `layouts` |
| `features` | As funcionalidades: catálogo, NFT, favoritos, carrinho, checkout, pedidos, conta | `core`, `ui`, `pattern`, `features`, `contracts` |
| `routes` | Rotas: guard, parâmetros de busca, prefetch e composição | `core`, `ui`, `pattern`, `layouts`, `features` |
| `mocks` | MSW: banco simulado, fixtures, handlers, Socket.IO e cenários | `core`, `mocks`, `contracts` |

Um recurso passa pelas camadas assim:

1. O schema fica em `contracts`.
2. A função em `core/api` chama o Axios e valida a resposta com esse schema.
3. A chave fica em `core/keys` e as `queryOptions` em `core/queries`.
4. A rota faz o prefetch e a feature lê com `useQuery`.
5. O handler em `mocks` valida a entrada com o mesmo schema.

---

## Contratos REST

A base é `/api`. Com login, as chamadas levam `Authorization: Bearer <token>`. Sem login, levam `X-Cart-Id: <uuid>` para identificar o carrinho do visitante. Valores em ETH vão como string decimal (`^\d+(\.\d{1,18})?$`) e quantidades como inteiros.

### Erros

Todo erro vem como `application/problem+json`:

```json
{ "type": "https://kurio.dev/problemas/quote_outdated", "title": "...", "status": 409, "detail": "...", "code": "quote_outdated", "errors": { "campo": ["mensagem"] } }
```

| Código | Status | Quando acontece |
| --- | --- | --- |
| `validation_error` | 422 | Corpo ou parâmetros inválidos. `errors` traz a mensagem de cada campo, que aparece no campo certo do formulário |
| `unauthenticated` | 401 | Sem token ou com credenciais erradas |
| `session_expired` | 401 | Token expirado ou que não existe mais |
| `forbidden` | 403 | Pedido de outra conta |
| `not_found` | 404 | NFT, pedido ou item que não existe |
| `email_taken`, `username_taken` | 409 | Conflito no cadastro ou na edição do perfil |
| `availability_conflict` | 409 | Edição esgotada, quantidade acima do estoque ou carrinho vazio |
| `quote_outdated` | 409 | Preço, estoque, cupom ou taxa mudaram desde a revisão. Vem com a cotação nova |
| `wallet_rejected` | 409 | A carteira recusou a conexão ou foi desconectada |
| `coupon_invalid`, `coupon_expired` | 422 | Cupom que não existe ou expirou |
| `idempotency_conflict` | 422 | Mesma `Idempotency-Key` com outro corpo |
| `transient` | 503 | Falha passageira, com `Retry-After` |
| `internal` | 500 | Erro do servidor |

No app, toda falha vira um `FriendlyError` (status, código, título, detalhe, erros por campo e `Retry-After`). Timeout, queda de rede e resposta fora do contrato também viram `FriendlyError`, com os códigos `timeout`, `network_error` e `invalid_response`.

### Rotas

#### Sessão

- `POST /auth/register` - cria a conta com `{ username, email, password }` e devolve `201 { token, expiresAt, user }`. Junta o carrinho do visitante ao da conta
- `POST /auth/login` - entra com `{ email, password }` e devolve `{ token, expiresAt, user }`. Também junta o carrinho do visitante
- `GET /auth/session` - devolve `{ user, expiresAt }` da sessão atual
- `POST /auth/logout` - encerra a sessão (`204`)

#### NFTs

- `GET /nfts` - lista com `q`, `aba`, `colecao[]`, `rede[]`, `precoMin`, `precoMax`, `ordem`, `pagina` e `porPagina`. Devolve `{ items, total, page, pageSize, facets }`
- `GET /nfts/highlights` - devolve `{ hero, featured }` para o hero e o "NFT em destaque"
- `GET /nfts/:id` - detalhe com edições, galeria, atributos, avaliações e `version`
- `GET /nfts/:id/related` - NFTs relacionados

#### Favoritos

- `GET /me/favorites` - lista de interesse do usuário
- `PUT /me/favorites/:nftId` - adiciona
- `DELETE /me/favorites/:nftId` - remove

#### Carrinho e cotação

- `GET /cart` - carrinho com o estado atual de cada NFT e edição, `acceptedPrice`, `couponCode`, `itemCount` e `updatedAt`
- `POST /cart/items` - adiciona `{ nftId, editionId, quantity }` (`201`)
- `PATCH /cart/items/:lineId` - muda a quantidade ou aceita o preço novo (`{ quantity?, acceptPrice? }`)
- `DELETE /cart/items/:lineId` - remove o item
- `PUT /cart/coupon` - aplica `{ code }`
- `DELETE /cart/coupon` - remove o cupom
- `POST /quotes` - calcula a cotação: cupom, subtotal, desconto, taxa de rede, total, pendências e `version`

#### Pedidos

- `POST /orders` - cria o pedido. Exige o header `Idempotency-Key` e recebe `{ quoteId, quoteVersion, connectionId, walletSource, collector }`. Devolve `201`, ou `200` com `Idempotent-Replayed: true` quando a tentativa já existia
- `GET /orders/:orderId` - estado do pedido e snapshot do recibo
- `GET /orders` - pedidos do usuário, com filtro opcional por `status`
- `POST /wallet-connections` - conecta a carteira simulada `{ provider, network, address }`
- `DELETE /wallet-connections/:id` - desconecta

#### Perfil e carteiras

- `GET /me/profile` - dados do perfil
- `PATCH /me/profile` - atualiza `{ displayName, username, email, ensName, walletNickname }`
- `PUT /me/avatar` - envia o avatar (multipart, PNG, JPG ou WebP até 1 MB)
- `DELETE /me/avatar` - remove o avatar
- `PUT /me/password` - troca a senha com `{ currentPassword, newPassword }` (`204`)
- `GET /me/wallets` - carteiras `{ primary, secondary }`
- `PUT /me/wallets/:role` - cadastra ou atualiza a carteira `primary` ou `secondary`

#### Outros

- `POST /newsletter` - inscreve `{ email }` (`201`)

#### Controle dos mocks

Só existem no mock e respondem sem latência:

- `GET /__mocks/state` e `PUT /__mocks/scenario` - consulta e troca o cenário
- `POST /__mocks/reset` - volta os dados ao estado inicial
- `POST /__mocks/failures` - faz uma rota falhar algumas vezes
- `POST /__mocks/session/expire` - expira a sessão atual
- `POST /__mocks/nfts/:nftId/update` - muda preço ou estoque de uma edição
- `POST /__mocks/realtime/drop` e `POST /__mocks/realtime/replay` - derruba o socket ou reenvia eventos

---

## Eventos em tempo real

Todo evento tem o mesmo formato, e o app valida cada um com o schema de `contracts/events.ts`:

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

`nft.updated` vai para todo mundo (`userId: null`) com o estado novo do NFT e das edições. O app atualiza o detalhe, as listas e os favoritos. Se o NFT está no carrinho, busca de novo o carrinho e a cotação e avisa o que mudou. Se o detalhe está aberto e o NFT não está no carrinho, avisa a mudança de preço ou o esgotamento da edição.

`order.updated` vai só para o dono do pedido, com o pedido completo. O app atualiza a tela do pedido e, quando ele termina, busca de novo carrinho, cotação e catálogo e limpa a tentativa de checkout.

No mock, toda mudança de NFT e todo fim de pedido passam por uma única função, que grava no banco e publica o evento. Assim a API REST e os eventos nunca ficam diferentes.

---

## Socket.IO nos mocks

O servidor Socket.IO é simulado com o `ws.link` do MSW e o `@mswjs/socket.io-binding`, que fala o protocolo do Engine.IO e do Socket.IO. O app usa o `socket.io-client` normal.

Detalhes e limitações desse transporte:

- O MSW intercepta WebSocket, mas não long-polling, então o cliente usa só `transports: ['websocket']`.
- O `engine.io-client` guarda o `WebSocket` quando é carregado. Por isso o `socket.io-client` só é importado depois que o MSW inicia (`core/realtime.ts`), e o lint proíbe o import estático.
- O MSW 3 tira o prefixo `/socket.io/` da URL antes de comparar, então o `ws.link` aponta para a origem da página.
- O handshake simulado anuncia ping a cada 25 s. Sem ping o cliente cairia a cada 30 s, então o mock envia o ping a cada 10 s.
- O binding não tem rooms nem namespaces. O mock liga cada conexão ao usuário do token, que vai na query string do handshake, e filtra quem recebe cada evento.
- Não existe connection state recovery (o `sid` é fixo). Por isso o app sempre busca de novo na API quando reconecta.
- O binding pede `msw@^2`. Um `overrides` no `package.json` deixa usar com o MSW 3, e o teste `e2e/unit/realtime-transport.unit.ts` cobre handshake, eventos, queda, reconexão e ping.

---

## Sessão

O token é guardado no `localStorage` e o Axios envia em toda chamada. Ele dura 2 horas, ou 45 s no cenário `sessao-expirada`.

Depois de um refresh, a sessão é recuperada com `GET /auth/session`. Se a resposta for 401, o token é apagado e o usuário fica deslogado.

Checkout, perfil, carteiras, favoritos e pedidos passam por um único guard (`requireSession`). Sem sessão, o usuário vai para o login e volta para onde estava depois de entrar.

Se a sessão expira no meio do uso, qualquer 401 de uma chamada com token encerra a sessão. Numa página privada, o app leva ao login com o aviso de sessão expirada; numa página pública, só avisa.

O formulário de pagamento é salvo no `sessionStorage` a cada mudança, por usuário, e volta quando o mesmo usuário entra de novo. O rascunho guarda também qual carteira estava escolhida. Com carteira cadastrada, os dados vêm sempre do perfil, então uma edição feita em "Trocar carteira" aparece ao voltar. Com "Outra carteira", vale o que foi digitado.

No logout e na troca de usuário, o app cancela e remove do cache tudo o que é privado (perfil, carteiras, favoritos, pedidos, carrinho e cotação), descarta o carrinho de visitante e fecha o socket, que reconecta com o token novo. O logout também apaga o rascunho do pagamento. A tentativa de idempotência continua salva, porque não tem dados pessoais e evita comprar de novo se houver um pedido pendente. As chaves do cache incluem o `userId`, e o app ignora eventos de outro usuário.

As senhas ficam no mock só como hash SHA-256 com salt. Nenhuma senha é guardada no navegador.

---

## Carrinho

O carrinho fica no servidor (no mock), tanto para visitante quanto para usuário logado. O visitante recebe um id anônimo, salvo no `localStorage` e enviado em `X-Cart-Id`, então o carrinho sobrevive ao refresh.

No login e no cadastro, os itens do visitante entram no carrinho da conta, respeitando o estoque de cada edição. Depois disso o id anônimo é descartado, e depois de um logout o carrinho começa vazio.

Adicionar ou aumentar a quantidade respeita o estoque da edição e o limite de 10 unidades por pedido. Passando disso, a API responde `availability_conflict`.

Cada item guarda o `acceptedPrice`, que é o preço que o usuário viu ao adicionar. Ele só muda quando o usuário clica em "Aceitar novo preço".

O resumo vem sempre da cotação (`POST /quotes`), calculada em wei:

- subtotal com os preços atuais;
- desconto do cupom;
- taxa de rede, somada por rede diferente no carrinho (Ethereum 0,016, Polygon 0,002 e Solana 0,0008);
- pendências por item: preço mudou (`price_changed`), estoque insuficiente (`insufficient`) ou esgotado (`sold_out`);
- uma `version`, que é um hash de itens, preços, estoque, cupom, taxa e pendências.

Enquanto houver pendência, o botão "Conectar e finalizar" fica bloqueado.

---

## Pedido

"Confirmar compra" busca uma cotação nova e abre a revisão. No envio, o servidor calcula a cotação de novo. Se a versão mudou ou tem pendência, responde `quote_outdated` com a cotação nova. Se só o preço mudou, o usuário precisa clicar em "Aceitar novos valores" e confirmar de novo; se uma edição esgotou, o diálogo leva ao carrinho.

Cada tentativa tem uma chave (`crypto.randomUUID`) ligada ao hash do corpo e salva por usuário no `sessionStorage`. O mesmo corpo usa a mesma chave, e um corpo diferente gera outra. O servidor devolve o mesmo pedido para a mesma chave e o mesmo corpo, e responde `idempotency_conflict` se a chave vier com outro corpo.

O botão fica desabilitado durante o envio, então o clique duplo não cria dois pedidos. Em timeout (8 s), queda de rede ou erro 5xx, o app reenvia com a mesma chave até 3 vezes e mostra "Verificando o pedido".

O pedido começa `pending` e vira `confirmed` ou `declined` 2,5 s depois. A resolução é por horário (`settleAt`) e também é conferida em toda leitura, então refresh, troca de aba ou reconexão sempre mostram o estado certo. Um pedido confirmado ou recusado não muda mais.

Se o usuário abre `/checkout` com uma tentativa pendente, vai direto para o pedido, sem poder comprar de novo.

O recibo só aparece para pedido confirmado e é montado com o snapshot gravado no pedido (itens, preços, desconto, taxa, total, carteira e transação simulada). Mudanças no catálogo depois disso não alteram o recibo.

Na confirmação, o servidor baixa o estoque e tira do carrinho só os itens e quantidades comprados. Se o pagamento é recusado, nada sai do carrinho.

---

## Cache, retries e sincronização

| Dado | Política |
| --- | --- |
| Padrão | `staleTime` de 30 s |
| Lista do catálogo | `keepPreviousData`, para a lista anterior ficar na tela enquanto a nova carrega |
| Sessão | `staleTime: Infinity`, atualizada no login, no logout e na expiração |
| Cotação | `staleTime: 0`. A chave inclui o `updatedAt` do carrinho, então qualquer mudança gera uma cotação nova |
| Pedido pendente | Consulta a cada 5 s como reserva. O evento `order.updated` atualiza na hora |

Leituras tentam de novo até 2 vezes, só em falha de rede, timeout ou erro 5xx. Respeitam o `Retry-After` ou esperam cada vez mais, até 8 s. Erros 4xx e respostas fora do contrato não são repetidos.

Se uma atualização em segundo plano falha e a tela já tem dados, os dados continuam na tela e a próxima atualização recupera. O erro com "Tentar novamente" só aparece quando a primeira carga falha.

Mutations não tentam de novo sozinhas. A única exceção é o pedido, que reenvia com a mesma chave de idempotência.

Favoritar, mudar a quantidade no carrinho e remover item usam atualização otimista. Se der erro, o estado anterior volta e a mensagem da API aparece.

O `AbortSignal` do TanStack Query vai até o Axios, e cada combinação de filtros tem a sua chave de cache. Uma resposta antiga nunca substitui a mais nova, e isso tem teste com o cenário `fora-de-ordem`.

Depois de uma mutation, o carrinho e o cupom gravam no cache o carrinho que a API devolveu, e perfil e carteiras gravam a resposta. Eventos e pedidos finalizados invalidam carrinho, cotação e catálogo.

Busca, filtros, aba, ordem e página do catálogo ficam na URL, então sobrevivem ao refresh e ao voltar e avançar do navegador. A busca do mobile usa `replace` com 300 ms de espera, filtros e paginação usam `push`, e mudar qualquer filtro volta para a página 1.

---

## Reconciliação entre REST e Socket.IO

1. NFTs e pedidos têm uma `version` que aumenta a cada mudança, igual na API e nos eventos.
2. O app descarta eventos repetidos (mesmo `eventId`) e eventos com versão menor ou igual à última aplicada para o mesmo recurso. Nada é aplicado duas vezes, nem os avisos.
3. Um evento só muda o cache se for mais novo que o dado que já está lá. Pedidos já finalizados ignoram eventos.
4. Ao reconectar, o app busca de novo na API os NFTs, o carrinho, a cotação e os pedidos que estão na tela, para pegar o que mudou durante a queda. A tela avisa quando a conexão cai e quando volta.
5. O socket abre depois dos mocks, é recriado na troca de usuário e fechado no logout. Os listeners são removidos quando o componente sai da tela.
6. O aviso de mudança no carrinho compara o preço novo com o `acceptedPrice`, que não muda sozinho. Comparar com o cache perdia avisos quando dois eventos chegavam em sequência.

---

## Valores em ETH

Todo cálculo é feito em wei com `bigint` (18 casas), em `core/money.ts`: soma, subtração, multiplicação por quantidade, porcentagem e comparação. Nenhum `number` entra em conta de dinheiro. Na tela, os valores aparecem com pelo menos duas casas (`1.19 ETH`, `0.016 ETH`, `(-) 0.00`).

---

## Decisões de UX

Breakpoints:

- abaixo de 768 px, layout mobile com barra inferior;
- de 768 a 1024 px, header de desktop e filtros numa gaveta;
- acima de 1024 px, filtros na lateral.

No mobile, detalhe, carrinho, pagamento, login e cadastro escondem a barra inferior, como no Figma.

Outras decisões:

- "Mercado" fica ativo no detalhe, no carrinho e no pagamento, e leva ao catálogo no Início.
- Deixei login e cadastro como rotas próprias, para o acesso direto e o retorno ao fluxo funcionarem. No desktop eles abrem como diálogo sobre o Início, como no Figma; no mobile, como página inteira.
- O pagamento é uma página só no desktop e duas etapas no mobile (dados do colecionador e "Pagamento com carteira"). Ao trocar de etapa, a página volta ao topo e o foco vai para o título da etapa.
- Incluí um diálogo de revisão antes de enviar o pedido. Ele não está no Figma, mas o enunciado pede revisão antes do envio.
- A carteira cadastrada (Principal, Reserva ou outra) define endereço e rede, e o provedor (MetaMask, WalletConnect ou Coinbase Wallet) é a conexão simulada.
- A confirmação é uma rota própria (`/orders/:id`) com o card do Figma. Pedido pendente e recusado usam o mesmo card.
- A "Lista de interesse" do perfil é a tela de favoritos, e o coração da barra mobile leva para ela.
- "Comprar" adiciona ao carrinho e abre o carrinho. O botão de carrinho (no mobile e no hover do card) só adiciona e mostra um aviso com o atalho "Ver carrinho".
- O botão central da barra mobile abre a busca, porque o ícone do Figma não tem um fluxo no escopo.
- Criadores, Aprenda, Atividade, Ofertas, Arquivos baixados, Suporte, Central de ajuda, Minha coleção, Estúdio do criador e "Esqueceu a senha?" aparecem desabilitados, com o aviso "Em breve".
- Login com Google e Facebook avisa que não está disponível na demo.
- "Ver no Etherscan" abre um aviso de que a transação é simulada, com o hash para copiar.
- Compartilhar usa os links reais (LinkedIn, X e e-mail), o contato usa `mailto:` e `tel:`, e as redes sociais abrem em outra aba.
- A newsletter tem um endpoint simulado e confirmação de verdade.
- O perfil tem um único "Salvar", como no Figma. A senha só muda se os campos de senha forem preenchidos.
- Os avisos de mudança no carrinho ficam 10 s na tela, mais que os outros, para dar tempo de ler.

---

## Desvios do Figma

- No Figma o título do resumo do carrinho está "Resumo da carteira", o que parece engano, então usei "Resumo do pedido".
- O carrinho no desktop mostra a edição de cada item, porque o estoque é por edição.
- O seletor de carteira cadastrada também aparece no pagamento desktop. No Figma ele só aparece no mobile.
- Login e cadastro têm label visível acima dos campos. No Figma os campos só têm placeholder.
- Medidas que não dava para ler nos prints foram aproximadas pela grade de 1200 px do layout.

---

## Substituição de assets

As NFTs usam quatro artes de exemplo, convertidas para WebP em 320, 640 e 1024 px. As versões entregues ficam em `public/images/nfts/` (de 8 KB a 73 KB). Os PNG originais e os prints do Figma ficam fora do repositório.

Cada arte é uma família, como no Figma:

- óculos e jaqueta verde: Emerald Ape;
- chapéu e moletom roxo: Sage Nomad, Cosmic Bloom, Violet Nomad e o "NFT em destaque";
- gola alta e blazer: Neon Vessel e Ivory Baron;
- fones: Golden Beat, Golden Rhythm e Golden Signal.

A primeira página do catálogo e os banners seguem a distribuição dos prints. As NFTs geradas recebem a arte pelo nome (Ape, Nomad, Baron e Vessel, Beat, Signal e Echo); os outros nomes alternam entre as quatro. Os atributos acompanham a arte. As imagens individuais do Figma não foram exportadas.

Outras trocas:

- O logo "KURIO" é texto na fonte do layout.
- O ícone "Thank you" do recibo virou o ícone `MailCheck` do Lucide.
- Os ícones de marca (Google, Facebook, X, LinkedIn, Instagram e YouTube) vêm do `react-icons`, porque o Lucide não tem ícones de marca.
- A fonte Roboto Mono é servida pelo próprio app (`@fontsource-variable/roboto-mono`), sem depender do Google Fonts.

---

## Acessibilidade

- Tem link "Pular para o conteúdo", foco visível em todos os controles e `aria-current` na navegação.
- As edições do NFT são radios nativos.
- Diálogos e gavetas prendem o foco e devolvem para quem os abriu.
- Os erros dos formulários ficam ligados aos campos (`aria-describedby`, `aria-invalid` e `aria-required`), inclusive os que vêm da API.
- Mutations e eventos em tempo real geram avisos em região `aria-live`.
- Nenhum estado depende só de cor: edição esgotada aparece riscada e com aviso, e as pendências do carrinho têm texto.
- Os skeletons com shimmer respeitam `prefers-reduced-motion`.
- Os pontos dos carrosséis têm área de toque de 24 px, mas o ponto continua do tamanho do Figma.
- A varredura axe (WCAG 2.1 A e AA) roda nos testes em todas as telas principais, e a responsividade também é testada em 320 px (equivalente a zoom de 400%).

Ajustes em relação ao Figma:

- O tom de texto secundário dos metadados (`#8b724d`, contraste de 4,2:1) foi trocado pelo secundário geral (`#a0896b`, 5,7:1).
- O botão da conta tem o nome do usuário como nome acessível, em vez das iniciais.
- O botão "Conectar e finalizar" bloqueado usa cores de inativo com contraste suficiente, em vez de só transparência.

---

## Performance

- O layout da loja e o Início vêm no bundle principal. As outras rotas são divididas automaticamente pelo TanStack Router.
- No build com mocks, um plugin do Vite pré-carrega o chunk do MSW junto com o JS principal.
- As imagens são WebP com `srcset` e tamanho fixo. Só a imagem do LCP (o primeiro card e o hero) tem prioridade alta, e o hero só é renderizado no layout que está na tela.
- Os skeletons têm o mesmo tamanho do conteúdo, para não deslocar o layout.
- Os devtools do TanStack só existem em desenvolvimento.

O resultado do Lighthouse e a explicação da nota mobile estão no [README](README.md#performance-lighthouse).

---

## Limitações conhecidas

- Os mocks rodam no navegador, então cada aba tem a sua cópia do banco simulado, e elas só se sincronizam pelo `localStorage` ao recarregar.
- Os eventos em tempo real só chegam na própria aba.
- O banco simulado fica no `localStorage`, que tem uns 5 MB por site. O avatar é salvo como data URL (até uns 1,4 MB). Se o espaço acabar, a gravação falha em silêncio e a mudança some no refresh. Com os limites atuais isso não acontece com os usuários da demo.
- Os mocks dependem de service worker. Em navegadores ou janelas que bloqueiam service workers, as chamadas falham e a tela mostra o erro com "Tentar novamente".
- Transações, links de explorador e conexão de carteira são simulados. Não tem integração com blockchain, extensão de carteira nem gateway de pagamento.
- Um carrinho pode ter NFTs de redes diferentes. O pedido é pago com uma carteira e uma rede só, e a taxa soma uma tarifa por rede. Numa integração real, o checkout separaria o pedido por rede ou exigiria uma carteira para cada uma.
- O `expiresAt` da cotação é só informativo. Quem garante que a cotação vale é a `version`, conferida de novo no envio do pedido.
- Os baselines visuais foram gerados no Windows e dependem de como a plataforma renderiza as fontes.
