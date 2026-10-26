# Kurio - Marketplace de NFTs

> **Loja de NFTs com catálogo, carrinho, pagamento com carteira e área do colecionador**

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack-Router%20%2B%20Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

Um marketplace de NFTs feito por mim com React, TypeScript, TanStack, Tailwind CSS e shadcn/ui, com base no layout do Figma da fictícia loja chamada de Kurio.

**Aplicação:** [https://nft-marketplace-three-tau.vercel.app](https://nft-marketplace-three-tau.vercel.app/)

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Configuração Inicial](#configuração-inicial)
- [Comandos](#comandos)
- [Usuários de teste e cupons](#usuários-de-teste-e-cupons)
- [Cenários dos mocks](#cenários-dos-mocks)
- [Reproduzindo os fluxos de falha](#reproduzindo-os-fluxos-de-falha)
- [Testes](#testes)
- [Performance (Lighthouse)](#performance-lighthouse)
- [Deploy](#deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Autor](#autor)

---

## Sobre o Projeto

O Kurio é um marketplace de NFTs, onde nele é possível explorar o catálogo, montar o carrinho, pagar com uma carteira simulada e cuidar do perfil e das carteiras. Funciona no desktop, no tablet e no celular (responsivo).

O projeto não tem backend, a API REST e o Socket.IO rodam dentro do navegador, com MSW. Basta clonar, instalar e rodar. Usei os mesmos mocks no desenvolvimento, nos testes e na build em produção.

As decisões de arquitetura, os contratos da API, as políticas de sessão, carrinho e cache e o tempo real estão no [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite**
- **TanStack Router**
- **TanStack Query**
- **TanStack Form** + **Valibot**
- **Axios**
- **Socket.IO**
- **Tailwind CSS** + **shadcn/ui**
- **MSW** + `@mswjs/socket.io-binding`
- **Playwright** + **axe**
- **Lighthouse**

---

## Features

A loja tem catálogo com filtros, carrinho, pagamento com carteira simulada e área do colecionador. O usuário pode navegar e montar o carrinho. As áreas de pagamento, perfil, carteiras, favoritos e necessitam de login.

Telas:

- **Início** - destaques, catálogo, busca, filtros, ordenação e paginação

- **Detalhe do NFT** - galeria, edições, quantidade, favoritos e compra

- **Carrinho** - quantidades, remoção, cupom e resumo de valores

- **Pagamento** - dados do colecionador, carteira, rede e revisão antes de enviar

- **Confirmação** - recibo com a transação, os itens, a taxa e o total

- **Login e Cadastro**

- **Perfil** - dados, avatar e troca de senha

- **Carteiras** - principal e secundária

O preço e disponibilidade mudam em tempo real. Se um NFT do carrinho muda durante a navegação, a tela avisa e o checkout não deixa confirmar com os valores antigos.

---

## Configuração Inicial

É necessário ter instalado o **Node.js 22** (com npm 11) e o **Google Chrome**, usado pelo Lighthouse.

**Instale as dependências**

```bash
npm ci
npx playwright install chromium
```

**Suba o projeto**

```bash
npm run dev
```

A aplicação abre em [http://localhost:3000](http://localhost:3000), com os mocks ligados.

**Variáveis de ambiente**

Não é preciso criar `.env`. Os arquivos `.env.development` (usado no `npm run dev`) e `.env.demo` (usado no build) já vêm no repositório, e o `.env.example` mostra as mesmas variáveis:

- `VITE_API_URL` - base das chamadas REST. Padrão: `/api`
- `VITE_WS_URL` - origem do Socket.IO. Vazio, pois usa a própria página
- `VITE_MOCKS` - liga o MSW no navegador. Padrão: `true`

---

## Comandos

- `npm run dev` - servidor de desenvolvimento com mocks
- `npm run build:demo` - build otimizado com mocks (o mesmo dos testes, do Lighthouse e do deploy)
- `npm run build` - build sem mocks, para usar com uma API real
- `npm run preview` - serve o último build em [http://127.0.0.1:4173](http://127.0.0.1:4173)
- `npm run typecheck` - verificação de tipos
- `npm run lint` - ESLint, incluindo as regras de camadas
- `npm run test:e2e` - todos os testes Playwright
- `npm run test:unit` - só os testes unitários
- `npm run test:visual:update` - atualiza os baselines de regressão visual
- `npm run lighthouse` - auditoria mobile e desktop, com resumo em `lighthouse/RESULTS.md`

---

## Usuários de teste e cupons

Todos usam a senha `Senha@123`. Protegida com o hash SHA-256 com salt.

- **Ana Souza** - `ana@kurio.dev`. Tem carteira principal e reserva e 2 NFTs na lista de interesse.
- **Bruno Lima** - `bruno@kurio.dev`. Só tem carteira principal e outra lista de interesse (bom para testar troca de usuário).
- `ocupado@kurio.dev` - use no cadastro para ver o conflito de conta.

Cupons:

- `KURIO10` - 10% de desconto
- `EXPIRADO` - cupom expirado
- Qualquer outro código - cupom inválido

---

## Cenários dos mocks

Os dados do mock (catálogo, usuários, sessões, favoritos, carteiras, carrinhos e pedidos) ficam salvos no `localStorage` do navegador, na chave `kurio-mocks:v5`, então sobrevivem ao refresh. O cenário escolhido também fica salvo.

- `padrao` - tudo respondendo, com 150 ms de latência
- `vazio` - catálogo sem resultados e sem destaques
- `lento` - toda resposta leva uns 2,5s, bom para ver os skeletons
- `latencia-variavel` - respostas entre 0,2 e 2,2s, sempre na mesma sequência
- `fora-de-ordem` - buscas curtas respondem depois das longas
- `offline` - as 3 primeiras chamadas do catálogo falham por rede
- `erro-500` - as 3 primeiras chamadas do catálogo retornam 500
- `erro-503` - as 3 primeiras chamadas do catálogo retornam 503 com `Retry-After`
- `sessao-expirada` - a sessão expira 45s depois do login
- `preco-alterado-no-checkout` - o preço do primeiro item sobe ao confirmar o pedido
- `esgotado-no-checkout` - a edição do primeiro item esgota ao confirmar o pedido
- `timeout-pedido` - o pedido é criado, mas a primeira resposta chega depois do timeout
- `pagamento-recusado` - a rede recusa o pagamento
- `carteira-recusada` - a primeira conexão da carteira é recusada

Nos cenários de falha do catálogo, configurei o mock para falhar 3 vezes. A chamada original e as duas tentativas automáticas falham, a tela mostra o erro e o "Tentar novamente" recupera.

**Como trocar de cenário**

- Apertando **Ctrl + K** em qualquer tela. Abre o modal de cenários, com Aplicar, Cancelar e Restaurar dados. Só existe com os mocks ligados.
- No celular, que não tem atalho, abra qualquer página com `?cenarios` no fim da URL para abrir o mesmo modal.
- Direto pela URL, em qualquer página: `http://localhost:3000/?cenario=erro-503`
- Pela API de controle, que só existe no mock:

```js
fetch('/api/__mocks/scenario', { method: 'PUT', body: JSON.stringify({ scenario: 'lento' }) })
```

**Como restaurar os dados**

Use "Restaurar dados" no modal de cenários, ou:

```js
fetch('/api/__mocks/reset', { method: 'POST', body: JSON.stringify({ scenario: 'padrao' }) })
```

Limpar os dados do site no navegador também volta tudo ao estado inicial.

**Falhas pontuais**

Dá para fazer qualquer rota falhar algumas vezes. O `kind` aceita um status HTTP (400 a 599), `offline` ou `timeout` (a resposta nunca chega e o Axios desiste em 8s):

```js
fetch('/api/__mocks/failures', { method: 'POST', body: JSON.stringify({ method: 'put', path: '/me/favorites/:nftId', kind: 500, times: 1 }) })
```

---

## Reproduzindo os fluxos de falha

Os `fetch` abaixo podem ser colados no console do navegador com a aplicação aberta, porque o MSW intercepta.

**Catálogo**

- **Falha e recuperação:** use o cenário `erro-503`, `erro-500` ou `offline`, abra o Início e clique em "Tentar novamente" quando o erro aparecer.
- **Skeletons:** use o cenário `lento` e abra o Início, o detalhe ou o carrinho.
- **Resposta fora de ordem:** use o cenário `fora-de-ordem` e busque "gol" e logo depois "golden signal". O resultado final é sempre o da última busca.
- **Catálogo vazio:** use o cenário `vazio`.
- **Timeout de leitura:** rode o comando abaixo e abra um NFT. A primeira chamada é abortada em 8s e o retry carrega o detalhe.

```js
fetch('/api/__mocks/failures', { method: 'POST', body: JSON.stringify({ method: 'get', path: '/nfts/:id', kind: 'timeout', times: 1 }) })
```

**Conta**

- **Conflito de cadastro:** em "Criar conta", use `ocupado@kurio.dev`.
- **Sessão expirada:** entre como Ana, abra o perfil, rode o comando abaixo e clique em "Carteiras". Ou use o cenário `sessao-expirada` e espere 45s.

```js
fetch('/api/__mocks/session/expire', { method: 'POST' })
```

- **Favorito com falha e rollback:** entre como Ana, rode o comando abaixo e favorite um NFT. O coração volta ao estado anterior e aparece o erro.

```js
fetch('/api/__mocks/failures', { method: 'POST', body: JSON.stringify({ method: 'put', path: '/me/favorites/:nftId', kind: 500 }) })
```

**Carrinho e pagamento**

- **Cupom inválido ou expirado:** no carrinho, aplique `NAOEXISTE` ou `EXPIRADO`.
- **Preço alterado no checkout:** use o cenário `preco-alterado-no-checkout` e faça uma compra até "Confirmar e pagar". O diálogo mostra a mudança e pede "Aceitar novos valores".
- **Edição esgotada no checkout:** use o cenário `esgotado-no-checkout` e faça o mesmo caminho. O pagamento é bloqueado e o diálogo leva ao carrinho.
- **Timeout com idempotência:** use o cenário `timeout-pedido` e confirme o pagamento. Depois de uns 8s o app reenvia com a mesma `Idempotency-Key` e recebe o mesmo pedido.
- **Pagamento recusado:** use o cenário `pagamento-recusado`. O pedido termina recusado e os itens continuam no carrinho.
- **Carteira recusada:** use o cenário `carteira-recusada`. A primeira conexão é recusada e a segunda funciona.
- **Pedido pendente após refresh:** confirme um pagamento e recarregue a página enquanto aparece "Aguardando confirmação na rede". O pedido volta sem criar outra compra.

**Tempo real**

- **Preço ou estoque mudando:** com um item no carrinho, rode o comando abaixo. Use `available: 0` no lugar do preço para esgotar a edição.

```js
fetch('/api/__mocks/nfts/emerald-ape-042/update', { method: 'POST', body: JSON.stringify({ editionId: '1-50', price: '1.5' }) })
```

- **Eventos duplicados e antigos:** depois de duas mudanças de preço, rode o comando abaixo. O mock reenvia o último evento duas vezes e mais um evento antigo, e a tela não muda.

```js
fetch('/api/__mocks/realtime/replay', { method: 'POST' })
```

- **Queda da conexão:** rode o comando abaixo. O app avisa, reconecta e busca de novo na API o que mudou.

```js
fetch('/api/__mocks/realtime/drop', { method: 'POST' })
```

---

## Testes

```bash
npm run test:e2e
npx playwright show-report
```

O Playwright gera o build e sobe o preview sozinho. O relatório fica em `playwright-report/` e os traces das falhas em `test-results/`. Cada teste abre um navegador novo, então um não interfere no outro.

Os testes rodam em cinco projetos:

- **desktop** (1440 x 900) - todos os testes
- **mobile** (390 x 844) - fluxos principais, regressão visual e responsividade
- **tablet** (768 x 1024) - responsividade
- **reflow** (320 x 640) - responsividade, equivalente a zoom de 400%
- **unit** - testes sem navegador

O que cada arquivo cobre:

- `00-mock-api` - contratos da API simulada
- `01-catalog` - busca, filtros, ordenação, paginação, histórico, resposta fora de ordem e página inexistente
- `02-detail` - acesso direto, NFT inexistente, edição esgotada e limite de quantidade
- `03-auth` - cadastro, login, expiração (inclusive no checkout), logout, troca de usuário e pedido de outra conta
- `04-favorites` - favoritar com atualização otimista e rollback
- `05-cart` - quantidades, remoção, cupons, refresh e carrinho do visitante após o login
- `06-purchase` - compra completa do catálogo ao recibo
- `07-payment-failures` - pagamento recusado, carteira recusada, clique duplo, timeout, preço alterado e esgotado
- `08-account` - perfil, avatar, senha e carteiras, com erros de validação
- `09-realtime-checkout` - mudança de preço e estoque por Socket.IO no detalhe, carrinho e checkout
- `10-realtime-resilience` - eventos duplicados e antigos, queda de conexão e pedido pendente
- `11-a11y` - varredura axe, teclado, foco em diálogos e erros nos campos
- `12-loading` - skeletons, falha e nova tentativa
- `13-scenarios` - modal de cenários pelo Ctrl + K e pela URL, com aplicar, cancelar e restaurar
- `visual` - regressão visual de Início, detalhe, carrinho e pagamento
- `responsive` - sem overflow horizontal em todas as telas

Os testes usam o app como um usuário usaria: as chamadas passam pelo MSW e os eventos chegam pelo `socket.io-client`, sem mexer no estado do app por dentro. Os baselines visuais foram gerados no Windows; depois de uma mudança visual intencional, rode `npm run test:visual:update`.

---

## Performance (Lighthouse)

A auditoria roda no Início e no detalhe do NFT, nos perfis mobile e desktop, sobre o build com o cenário padrão. São 3 medições por página e perfil, e a tabela mostra a mediana. Versões, ambiente e relatórios HTML e JSON ficam em [lighthouse/RESULTS.md](lighthouse/RESULTS.md).

| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | `/` | **68** | 100 | 100 | 100 | 5,01s | 0,031 | 200 ms |
| mobile | `/nfts/emerald-ape-042` | **67** | 100 | 100 | 100 | 5,16s | 0,000 | 186 ms |
| desktop | `/` | 97 | 100 | 100 | 100 | 1,10s | 0,006 | 0 ms |
| desktop | `/nfts/emerald-ape-042` | 97 | 100 | 100 | 100 | 1,09s | 0,002 | 0 ms |

**Sobre a nota de performance no mobile**

Acessibilidade, boas práticas e SEO ficam em 100 nos dois perfis, e a performance fica em 97 no desktop. No mobile ela cai para 67 e 68. Depois que eu investiguei os relatórios, descobri que o que pesa é o LCP. A primeira imagem do catálogo só aparece depois que os dados chegam, e aqui os dados vêm de uma API que roda dentro do próprio navegador. Antes disso, com a rede e a CPU limitadas do perfil mobile, o navegador precisa:

1. registrar e ativar o service worker do MSW, em toda medição, porque o Lighthouse sempre começa com o navegador limpo;
2. baixar o código dos mocks, uns 168 KB gzip além dos 205 KB da aplicação;
3. esperar a latência simulada de 150 ms de cada chamada.

Somando tudo, passam mais de 3s até a imagem começar a carregar. Na auditoria, mantive os mocks e a latência do jeito que rodam na build, para medir o mesmo app que está publicado. Com uma API de verdade, essas três questões somem.

Eu já otimizei a rota inicial vem no bundle principal, o chunk do MSW é pré-carregado junto com o JS, as imagens são WebP com `srcset`, só a imagem do LCP tem prioridade alta, o celular não baixa a imagem do hero do desktop, a fonte é servida pelo próprio app e o layout reserva espaço para nada pular na tela (CLS).

Percebi também que a nota mobile varia com a carga da máquina. Com uma só arte de NFT ela ficava em 74 e 73; as quatro artes acrescentam alguns downloads de imagem na primeira tela.

---

## Deploy

Publicado na Vercel: [https://nft-marketplace-three-tau.vercel.app](https://nft-marketplace-three-tau.vercel.app/)

O `vercel.json` roda o `npm run build:demo` e manda todas as rotas da SPA para o `index.html`, então dá para abrir qualquer rota direto ou dar refresh sem cair num 404. Arquivos estáticos como o `mockServiceWorker.js` e as imagens continuam sendo servidos normalmente.

Não precisa configurar variáveis na Vercel, pois o build usa o `.env.demo` do repositório. Se criar alguma variável no painel, ela sobrescreve o arquivo, então use os mesmos valores.

---

## Estrutura do Projeto

```
nft-marketplace/
├── src/
│   ├── contracts/            # Schemas Valibot e tipos usados pelo app e pelos mocks
│   ├── core/                 # Axios, chamadas da API, cache, sessão, tempo real e valores em ETH
│   ├── ui/                   # Componentes do shadcn/ui com o tema do Kurio
│   ├── pattern/              # Códigos reutilizáveis (formulários, erro, carrossel, stepper)
│   ├── layouts/              # Layouts da loja, do perfil e do recibo
│   ├── features/             # Catálogo, NFT, carrinho, checkout, pedidos e conta
│   ├── routes/               # Rotas (guards, parâmetros de busca e composição)
│   └── mocks/                # MSW: banco simulado, fixtures, handlers, Socket.IO e cenários
├── e2e/                      # Testes Playwright e baselines visuais
├── lighthouse/               # Configuração, resultados e relatórios do Lighthouse
├── public/                   # Service worker do MSW, imagens e ícones
├── vercel.json
├── vite.config.ts
└── playwright.config.ts
```

---

## Autor

**Guilherme Rocha (CoderRocha)**

- GitHub: [CoderRocha](https://github.com/coderrocha)
- LinkedIn: [Guilherme Rocha](https://www.linkedin.com/in/guilherme-rocha-da-silva)
