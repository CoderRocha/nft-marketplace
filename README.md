# Kurio - Marketplace de NFTs

Marketplace de NFTs com descoberta, compra e conta do colecionador, construído sobre o layout "Kurio" do Figma. Toda a API (REST e Socket.IO) é simulada no navegador com MSW, então o projeto roda a partir de um checkout limpo, sem backend.

Decisões de arquitetura, contratos, política de cache, sessão, carrinho, reconciliação em tempo real, limitações e desvios do Figma estão em [ARCHITECTURE.md](ARCHITECTURE.md).

## Stack

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface | React 19 + TypeScript 6 (strict) |
| Build | Vite 8 |
| Roteamento | TanStack Router (rotas por arquivo, search params validados, guards) |
| Estado remoto | TanStack Query |
| Formulários | TanStack Form + Valibot |
| Cliente HTTP | Axios |
| Tempo real | socket.io-client |
| Estilo e componentes | Tailwind CSS 4 + shadcn/ui (base-nova sobre Base UI) |
| Mocks | MSW 3 + @mswjs/socket.io-binding |
| Testes E2E, visuais e de acessibilidade | Playwright + @axe-core/playwright |
| Auditoria | Lighthouse CI |

## Requisitos

- Node.js 22 ou superior e npm 11.
- Google Chrome instalado (usado pelo Lighthouse CI).
- Chromium do Playwright para os testes (`npx playwright install chromium`).

## Setup

```bash
npm ci
npx playwright install chromium
npm run dev
```

A aplicação abre em `http://localhost:3000`, já com os mocks ligados.

## Variáveis de ambiente

Os arquivos `.env.development` (usado por `npm run dev`) e `.env.demo` (usado por `npm run build:demo`) são versionados e já ligam os mocks. Não é preciso criar `.env` para rodar o projeto. O `.env.example` documenta as mesmas variáveis.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Base das chamadas REST feitas pelo Axios. |
| `VITE_WS_URL` | vazio | Origem do Socket.IO. Vazio usa a própria origem da página. |
| `VITE_MOCKS` | `true` | Liga o MSW (REST e Socket.IO) no navegador. Com `false`, o app espera uma API real. |

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com mocks em `http://localhost:3000`. |
| `npm run build:demo` | Build otimizado com mocks (o mesmo usado nos testes, no Lighthouse e no deploy). |
| `npm run build` | Build otimizado sem mocks, para uso com uma API real. |
| `npm run preview` | Serve o último build em `http://127.0.0.1:4173`. |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`). |
| `npm run lint` | ESLint com regras de camadas (`eslint-plugin-boundaries`). |
| `npm run test:e2e` | Todos os testes Playwright (gera o build demo e sobe o preview sozinho). |
| `npm run test:unit` | Só os testes unitários, sem navegador. |
| `npm run test:visual:update` | Regenera os baselines de regressão visual. |
| `npm run lighthouse` | Build demo + auditoria mobile e desktop + resumo em `lighthouse/RESULTS.md`. |

## Credenciais fictícias

Todos os usuários usam a senha `Senha@123`. As senhas são guardadas no mock apenas como hash SHA-256 com salt.

| Usuário | E-mail | Observação |
| --- | --- | --- |
| Ana Souza | `ana@kurio.dev` | Carteiras Principal (Ethereum, MetaMask) e Reserva (Polygon, Coinbase), um NFT na lista de interesse. |
| Bruno Lima | `bruno@kurio.dev` | Só carteira principal, lista de interesse diferente da Ana (útil para testar troca de usuário). |
| Conta existente | `ocupado@kurio.dev` | Use este e-mail no cadastro para ver o conflito de conta. |

Cupons: `KURIO10` aplica 10% de desconto; `EXPIRADO` retorna cupom expirado; qualquer outro código retorna cupom inválido.

## Cenários dos mocks

O estado do mock (catálogo, usuários, sessões, favoritos, carteiras, carrinhos, pedidos) fica em memória e é espelhado no `localStorage` (`kurio-mocks:v4`), então sobrevive a refresh. O cenário ativo também fica salvo.

| Cenário | Comportamento |
| --- | --- |
| `padrao` | Latência de 150 ms e todos os serviços respondendo. |
| `vazio` | A busca de NFTs não retorna resultados e não há destaques. |
| `lento` | Todas as respostas levam cerca de 2,5 s (bom para ver os skeletons). |
| `latencia-variavel` | Respostas entre 0,2 e 2,2 s, em sequência reproduzível. |
| `fora-de-ordem` | Buscas mais curtas respondem depois das mais longas (simula resposta antiga chegando por último). |
| `offline` | As três primeiras chamadas ao catálogo falham por rede, depois recupera. |
| `erro-500` | As três primeiras chamadas ao catálogo retornam 500, depois recupera. |
| `erro-503` | As três primeiras chamadas ao catálogo retornam 503 com `Retry-After`, depois recupera. |
| `sessao-expirada` | Novas sessões expiram 45 s após o login. |
| `preco-alterado-no-checkout` | Ao confirmar o pedido, o preço do primeiro item do carrinho sobe 0,05 ETH. |
| `esgotado-no-checkout` | Ao confirmar o pedido, a edição do primeiro item do carrinho esgota. |
| `timeout-pedido` | O pedido é criado, mas a primeira resposta chega depois do timeout do cliente. |
| `pagamento-recusado` | A rede recusa o pagamento depois que o pedido é criado. |
| `carteira-recusada` | A primeira tentativa de conectar a carteira é recusada. |

Nos cenários de falha do catálogo, o mock falha três vezes de propósito: o TanStack Query faz a chamada original mais duas tentativas, a interface mostra o erro e o botão "Tentar novamente" recupera.

### Como selecionar e restaurar

- **Pela interface:** link "Cenários de teste" no rodapé (só aparece com mocks ligados). Escolha o cenário e use "Aplicar e recarregar". "Restaurar dados e recarregar" volta o banco ao seed original e aplica o cenário escolhido.
- **Pela URL:** abra qualquer página com `?cenario=<nome>`, por exemplo `http://localhost:3000/?cenario=erro-503`.
- **Pela API de controle** (só existe no mock, responde sem latência):
  - `PUT /api/__mocks/scenario` com `{ "scenario": "lento" }`
  - `POST /api/__mocks/reset` com `{ "scenario": "padrao" }`
  - `POST /api/__mocks/failures` com `{ "method": "put", "path": "/me/favorites/:nftId", "kind": 500, "times": 1 }` injeta falhas pontuais em qualquer rota. `kind` aceita um status HTTP (400 a 599), `offline` (falha de rede) ou `timeout` (a resposta nunca chega e o Axios aborta em 8 s).
- Limpar os dados do site no navegador também restaura o seed.

## Reproduzindo os fluxos de falha

As chamadas `fetch` abaixo podem ser coladas no console do navegador com a aplicação aberta (o MSW intercepta).

| Fluxo | Como reproduzir |
| --- | --- |
| Catálogo com falha e recuperação | Cenário `erro-503`, `erro-500` ou `offline`; abra o Início e clique em "Tentar novamente" quando o erro aparecer. |
| Timeout de leitura | Rode `fetch('/api/__mocks/failures', { method: 'POST', body: JSON.stringify({ method: 'get', path: '/nfts/:id', kind: 'timeout', times: 1 }) })` e abra um NFT. A primeira chamada aborta em 8 s e o retry automático carrega o detalhe. |
| Skeletons | Cenário `lento`; abra Início, detalhe ou carrinho. |
| Resposta fora de ordem | Cenário `fora-de-ordem`; busque "gol" e logo depois "golden signal" pelo ícone de busca. O resultado final é sempre o da última busca. |
| Catálogo vazio | Cenário `vazio`. |
| Conflito de cadastro | Em "Criar conta", use `ocupado@kurio.dev`. |
| Sessão expirada | Entre como Ana, abra o perfil e rode `fetch('/api/__mocks/session/expire', { method: 'POST' })`; navegue para "Carteiras". Ou use o cenário `sessao-expirada` e espere 45 s. |
| Favorito com falha e rollback | Entre como Ana, rode `fetch('/api/__mocks/failures', { method: 'POST', body: JSON.stringify({ method: 'put', path: '/me/favorites/:nftId', kind: 500 }) })` e clique em "Favoritar" num NFT. |
| Cupom inválido ou expirado | No carrinho, aplique `NAOEXISTE` ou `EXPIRADO`. |
| Preço alterado durante o checkout | Cenário `preco-alterado-no-checkout`; faça uma compra até "Confirmar e pagar". O diálogo mostra a mudança e exige "Aceitar novos valores". |
| Edição esgotada durante o checkout | Cenário `esgotado-no-checkout`; mesma sequência. O pagamento é bloqueado e o diálogo leva ao carrinho. |
| Timeout com recuperação por idempotência | Cenário `timeout-pedido`; confirme o pagamento. Após cerca de 8 s o cliente reenvia com a mesma `Idempotency-Key` e recebe o mesmo pedido. |
| Pagamento recusado | Cenário `pagamento-recusado`; o pedido termina recusado e os itens continuam no carrinho. |
| Carteira recusada | Cenário `carteira-recusada`; a primeira conexão é recusada, a segunda funciona. |
| Preço ou estoque alterado em tempo real | Com um item no carrinho, rode `fetch('/api/__mocks/nfts/emerald-ape-042/update', { method: 'POST', body: JSON.stringify({ editionId: '1-50', price: '1.5' }) })`. Use `available: 0` para esgotar. |
| Eventos duplicados e antigos | Depois de duas alterações de preço, rode `fetch('/api/__mocks/realtime/replay', { method: 'POST' })`. O mock reenvia o último evento duas vezes e uma versão antiga. |
| Queda da conexão em tempo real | Rode `fetch('/api/__mocks/realtime/drop', { method: 'POST' })`. O cliente reconecta e reconcilia com a API. |
| Pedido pendente após refresh | Confirme um pagamento e recarregue a página enquanto aparece "Aguardando confirmação na rede". O pedido é retomado sem criar outra compra. |

## Testes

Os testes ficam em `e2e/` e rodam contra o build demo (`npm run build:demo` + `npm run preview`), que o Playwright sobe e derruba sozinho.

```bash
npm run test:e2e
npx playwright show-report
```

| Projeto | Viewport | O que roda |
| --- | --- | --- |
| `unit` | sem navegador | Dinheiro em wei, filtro de eventos duplicados e antigos, transporte Socket.IO sobre MSW. |
| `desktop` | 1440 x 900 | Todos os specs. |
| `mobile` | 390 x 844 | Fluxos principais (`@main`), regressão visual (`@visual`) e responsividade (`@responsive`). |
| `tablet` | 768 x 1024 | Responsividade (`@responsive`). |
| `reflow` | 320 x 640 | Responsividade (`@responsive`); equivale a 1280 px com zoom de 400% (WCAG 1.4.10). |

| Spec | Cobertura |
| --- | --- |
| `00-mock-api` | Contratos da API simulada (filtros, paginação, 404, cenários, autenticação). |
| `01-catalog` | Busca, filtros combinados, ordenação, paginação, histórico e refresh, resposta fora de ordem, página fora do intervalo, busca mobile pendente cancelada ao abrir um NFT. |
| `02-detail` | Acesso direto, NFT inexistente, edição indisponível, limite de quantidade. |
| `03-auth` | Cadastro com conflito, login com retorno, expiração (inclusive com relógio controlado e durante o checkout, com rascunho e carteira restaurados), logout apagando o rascunho, troca de usuário, pedido de outra conta (403). |
| `04-favorites` | Atualização otimista, falha com rollback, persistência. |
| `05-cart` | Quantidades, remoção, cupons, persistência após refresh, carrinho do visitante preservado no login. |
| `06-purchase` | Compra completa do catálogo ao recibo, com recibo imutável. |
| `07-payment-failures` | Pagamento recusado, carteira recusada, clique duplo, timeout com mesma chave, preço alterado e esgotado. |
| `08-account` | Perfil, avatar, senha e carteiras, com erros de validação e da API. |
| `09-realtime-checkout` | `nft.updated` no detalhe (com aviso acessível), carrinho e checkout, bloqueando cotação desatualizada. |
| `10-realtime-resilience` | Eventos duplicados e antigos, queda e reconexão, pedido pendente retomado. |
| `11-a11y` | Varredura axe WCAG 2.1 A/AA, teclado, foco em diálogos e gaveta, erros associados aos campos. |
| `12-loading` | Skeletons em rede lenta, falha e nova tentativa. |
| `visual` | Regressão visual de Início, detalhe, carrinho e pagamento (desktop e mobile). |
| `responsive` | Ausência de overflow horizontal em todas as telas, nas quatro larguras (390, 768, 1440 e 320 px de reflow). |

Observações:

- Cada teste usa um contexto novo do navegador, então começa com estado e `localStorage` limpos.
- O relatório HTML fica em `playwright-report/` e os traces das falhas em `test-results/`.
- Localmente o Playwright usa 1 worker (2 no CI) para não esgotar a memória da máquina; a suíte completa leva cerca de 5 minutos.
- Os baselines visuais em `e2e/__screenshots__/` foram gerados no Windows. Depois de uma mudança visual intencional, rode `npm run test:visual:update`.
- Os testes de tempo real passam pelo `socket.io-client` real e os de REST pelos handlers MSW; cenários sensíveis a tempo controlam latência (cenários), disparo de eventos (API de controle) e relógio (`page.clock`).

## Performance (Lighthouse)

Auditoria de Início e detalhe do NFT, perfis mobile e desktop, sobre o build demo com o cenário padrão dos mocks. Mediana de 3 execuções por página e perfil. Detalhes, versões e condições em [lighthouse/RESULTS.md](lighthouse/RESULTS.md); relatórios HTML e JSON da execução representativa em `lighthouse/reports/`.

| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | `/` | **71** | 100 | 100 | 100 | 4,62 s | 0,031 | 181 ms |
| mobile | `/nfts/emerald-ape-042` | **68** | 100 | 100 | 100 | 4,64 s | 0,000 | 269 ms |
| desktop | `/` | 98 | 100 | 100 | 100 | 1,03 s | 0,006 | 3 ms |
| desktop | `/nfts/emerald-ape-042` | 97 | 100 | 100 | 100 | 1,03 s | 0,002 | 3 ms |

Ambiente: Lighthouse 12.6.1 via LHCI 0.15, Chrome 155 headless, Node 22, Windows 11, throttling padrão do perfil mobile (RTT 150 ms, 1,6 Mbps, CPU 4x). A nota de performance varia com a carga da máquina: nesta execução o benchmark index foi 2093, contra 2577 numa execução anterior (74 e 73 no mobile, TBT de 52 e 15 ms). O LCP, que define o resultado, ficou em cerca de 4,6 s nas duas.

### Por que a performance mobile fica abaixo de 90

Todas as outras metas são atingidas (acessibilidade, boas práticas e SEO em 100), e o mesmo build tira 97 e 98 no desktop. No mobile, o LCP (cerca de 4,6 s) é dominado pela fase "Load Delay" da imagem principal, que depende de dados da API. A cadeia até esses dados passa pela camada de mocks, que roda no navegador:

1. **Service worker do MSW:** o worker precisa ser registrado e ativado antes de qualquer chamada, e o Lighthouse sempre mede com o perfil limpo, então paga esse custo em toda execução.
2. **Peso do código de mocks:** cerca de 168 KB gzip no caminho crítico, além dos cerca de 205 KB gzip da aplicação. Só o `tldts`, usado pelo `tough-cookie` dentro do MSW para a lista de sufixos públicos, ocupa cerca de 47 KB gzip.
3. **Latência simulada:** 150 ms em cada chamada no cenário padrão (catálogo, destaques, carrinho).

Sob a rede e a CPU limitadas do perfil mobile, isso soma mais de 3 s antes de a imagem começar a carregar. O enunciado proíbe simplificações exclusivas para a auditoria, então os mocks e a latência foram mantidos. Com uma API real, esses três custos deixam de existir.

Otimizações aplicadas: rota inicial e layout da loja no bundle principal (sem segunda ida à rede para chunks), preload do chunk do MSW em paralelo com o JS principal, imagens WebP com `srcset`, prioridade alta para as primeiras imagens, fonte self-hosted com `font-display: swap`, área principal com altura mínima para evitar deslocamento do rodapé (o CLS do detalhe desktop caiu de 0,155 para 0,002).

Avaliado e descartado: trocar o `tldts` pela variante `tldts-icann` por alias de build economizaria cerca de 19 KB gzip, algo como 0,1 s no perfil mobile. Isso não muda a conclusão e exigiria alterar uma dependência interna do MSW, então ficou de fora.

## Deploy

**Pendente.** O `vercel.json` já está pronto: usa `npm run build:demo` (mocks ligados) e reescreve todas as rotas para `index.html`, para que acesso direto e refresh funcionem.

## Estrutura

```
src/
  contracts/   schemas Valibot e tipos compartilhados entre app e mocks
  core/        HTTP (Axios), API, query keys e options, sessão, tempo real, dinheiro
  ui/          componentes shadcn/ui reestilizados com os tokens do Kurio
  pattern/     peças reutilizáveis (formulários, estados de erro, carrossel, stepper)
  layouts/     estruturas visuais (loja, perfil, recibo)
  features/    funcionalidades (catálogo, NFT, carrinho, checkout, pedidos, conta)
  routes/      rotas finas: guards, search params e composição
  mocks/       MSW: banco simulado, fixtures, handlers REST, Socket.IO e cenários
e2e/           testes Playwright, helpers e baselines visuais
lighthouse/    configuração, script de resumo, resultados e relatórios
design/        prints do Figma usados como referência (fora do Git)
```
