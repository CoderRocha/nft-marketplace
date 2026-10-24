import { Link, useLocation } from '@tanstack/react-router'
import { cn } from 'cn'
import { HeartIcon, HouseIcon, ScanSearchIcon, SearchIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from 'react-icons/fa6'
import { ComingSoon } from '@pattern/coming-soon'

type ShopLayoutProps = {
  children: ReactNode
  cartCount: number
  account: ReactNode
  newsletter: ReactNode
  onSearch: () => void
}

const MARKET_PATHS = ['/nfts', '/cart', '/checkout']

const navItemClassName =
  'relative flex h-full items-center text-[0.9375rem] text-foreground transition-colors hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-primary'

const CartBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.625rem] font-bold text-primary-foreground"
    >
      {count > 9 ? '9+' : count}
    </span>
  ) : null

const cartLabel = (count: number) => (count === 0 ? 'Carrinho vazio' : `Carrinho com ${count} ${count === 1 ? 'item' : 'itens'}`)

const Header = ({ cartCount, account, onSearch }: Omit<ShopLayoutProps, 'children' | 'newsletter'>) => {
  const { pathname } = useLocation()
  const inMarket = MARKET_PATHS.some((path) => pathname.startsWith(path))
  return (
    <header className="hidden md:block">
      <div className="mx-auto flex h-15 w-full max-w-shop items-center justify-between border-b border-border px-6">
        <Link to="/" className="text-sm font-bold tracking-[0.2em]">
          KURIO
        </Link>
        <nav aria-label="Principal" className="h-full">
          <ul className="flex h-full items-center gap-10 lg:gap-14">
            <li className="h-full">
              <Link to="/" aria-current={pathname === '/' ? 'page' : undefined} className={navItemClassName}>
                Início
              </Link>
            </li>
            <li className="h-full">
              <Link to="/" hash="catalogo" aria-current={inMarket ? 'page' : undefined} className={navItemClassName}>
                Mercado
              </Link>
            </li>
            <li className="flex h-full items-center">
              <ComingSoon className="text-[0.9375rem] text-foreground/80">Criadores</ComingSoon>
            </li>
            <li className="flex h-full items-center">
              <ComingSoon className="text-[0.9375rem] text-foreground/80">Aprenda</ComingSoon>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-5">
          <button type="button" aria-label="Buscar NFTs" className="rounded-md p-1 hover:text-primary" onClick={onSearch}>
            <SearchIcon className="size-5" />
          </button>
          <Link to="/cart" aria-label={cartLabel(cartCount)} className="relative rounded-md p-1 hover:text-primary">
            <ShoppingCartIcon className="size-5" />
            <CartBadge count={cartCount} />
          </Link>
          {account}
        </div>
      </div>
    </header>
  )
}

const tabClassName =
  'flex size-12 items-center justify-center rounded-full text-muted-foreground transition-colors aria-[current=page]:text-primary'

const MobileTabBar = ({ cartCount, onSearch }: Pick<ShopLayoutProps, 'cartCount' | 'onSearch'>) => {
  const { pathname } = useLocation()
  const current = (match: boolean) => (match ? 'page' : undefined)
  return (
    <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <ul className="mx-auto flex h-18 max-w-md items-center justify-around rounded-t-3xl bg-card px-4 pb-[env(safe-area-inset-bottom)]">
        <li>
          <Link to="/" aria-label="Início" aria-current={current(pathname === '/')} className={tabClassName}>
            <HouseIcon className="size-5" />
          </Link>
        </li>
        <li>
          <Link
            to="/profile/favorites"
            aria-label="Lista de interesse"
            aria-current={current(pathname === '/profile/favorites')}
            className={tabClassName}
          >
            <HeartIcon className="size-5" />
          </Link>
        </li>
        <li>
          <button
            type="button"
            aria-label="Buscar NFTs"
            onClick={onSearch}
            className="-mt-10 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/40"
          >
            <ScanSearchIcon className="size-6" />
          </button>
        </li>
        <li>
          <Link
            to="/cart"
            aria-label={cartLabel(cartCount)}
            aria-current={current(pathname === '/cart')}
            className={cn(tabClassName, 'relative')}
          >
            <ShoppingCartIcon className="size-5" />
            <CartBadge count={cartCount} />
          </Link>
        </li>
        <li>
          <Link
            to="/profile"
            aria-label="Meu perfil"
            aria-current={current(pathname.startsWith('/profile') && pathname !== '/profile/favorites')}
            className={tabClassName}
          >
            <UserIcon className="size-5" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}

const HIGHLIGHTS = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    description: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com', icon: FaFacebookF },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: FaInstagram },
  { label: 'X (Twitter)', href: 'https://x.com', icon: FaTwitter },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: FaLinkedinIn },
  { label: 'YouTube', href: 'https://www.youtube.com', icon: FaYoutube },
]

const FOOTER_COLLECTIONS = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'utilidade', label: 'Utilidade' },
] as const

const HELP_LINKS = ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item']

const footerLinkClassName = 'text-[0.8125rem] text-foreground/90 hover:text-primary'

const FooterColumn = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col gap-3">
    <h2 className="text-base font-semibold">{title}</h2>
    <ul className="flex flex-col gap-2.5">{children}</ul>
  </div>
)

const Footer = ({ newsletter }: Pick<ShopLayoutProps, 'newsletter'>) => (
  <footer className="mx-auto mt-20 w-full max-w-shop px-4 md:px-6">
    <div className="grid gap-8 bg-card px-6 py-8 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
      {HIGHLIGHTS.map((highlight) => (
        <section key={highlight.letter} className="flex flex-col gap-3 lg:border-r lg:border-primary/60 lg:pr-6">
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
          >
            {highlight.letter}
          </span>
          <h2 className="text-base font-semibold">{highlight.title}</h2>
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">{highlight.description}</p>
        </section>
      ))}
      <section className="flex flex-col gap-3">{newsletter}</section>
    </div>
    <div className="grid gap-3 bg-band px-6 py-6 text-[0.8125rem] md:grid-cols-4 md:items-center lg:px-8">
      <p className="font-bold tracking-[0.15em]">KURIO</p>
      <p>Feito para colecionadores, criadores e cultura</p>
      <a href="mailto:contato@email.com" className="hover:text-primary">
        contato@email.com
      </a>
      <a href="tel:+551140028922" className="hover:text-primary">
        +55 11 4002 8922
      </a>
    </div>
    <div className="grid gap-8 bg-card px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
      <FooterColumn title="Meu perfil">
        <li>
          <Link to="/profile" className={footerLinkClassName}>
            Meu perfil
          </Link>
        </li>
        <li>
          <ComingSoon className={footerLinkClassName}>Minha coleção</ComingSoon>
        </li>
        <li>
          <ComingSoon className={footerLinkClassName}>Atividade</ComingSoon>
        </li>
        <li>
          <ComingSoon className={footerLinkClassName}>Estúdio do criador</ComingSoon>
        </li>
        <li>
          <Link to="/profile/favorites" className={footerLinkClassName}>
            Lista de interesse
          </Link>
        </li>
      </FooterColumn>
      <FooterColumn title="Central de ajuda">
        {HELP_LINKS.map((label) => (
          <li key={label}>
            <ComingSoon className={footerLinkClassName}>{label}</ComingSoon>
          </li>
        ))}
      </FooterColumn>
      <FooterColumn title="Coleções">
        {FOOTER_COLLECTIONS.map((collection) => (
          <li key={collection.id}>
            <Link to="/" search={{ colecao: [collection.id] }} hash="catalogo" className={footerLinkClassName}>
              {collection.label}
            </Link>
          </li>
        ))}
      </FooterColumn>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Redes sociais</h2>
          <ul className="flex gap-2">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (abre em nova aba)`}
                  className="flex size-7 items-center justify-center rounded-sm border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Carteiras compatíveis</h2>
          <p className="w-fit rounded-sm border border-border bg-band px-3 py-1.5 text-[0.625rem] font-bold tracking-wider text-primary">
            METAMASK · WALLETCONNECT · COINBASE
          </p>
        </div>
      </div>
    </div>
    <p className="py-4 text-center text-xs text-foreground/90">© 2026 Kurio. Propriedade digital para todos.</p>
  </footer>
)

export const ShopLayout = ({ children, cartCount, account, newsletter, onSearch }: ShopLayoutProps) => (
  <div className="flex min-h-dvh flex-col pb-24 md:pb-0">
    <Header cartCount={cartCount} account={account} onSearch={onSearch} />
    <main id="conteudo" className="flex-1">
      {children}
    </main>
    <Footer newsletter={newsletter} />
    <MobileTabBar cartCount={cartCount} onSearch={onSearch} />
  </div>
)
