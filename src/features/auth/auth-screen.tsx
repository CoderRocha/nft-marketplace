import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { CircleAlertIcon } from 'lucide-react'
import { useMediaQuery } from '@pattern/use-media-query'
import { Catalog } from '@features/catalog/catalog'
import { HeroCarousel } from '@features/catalog/hero-carousel'
import { catalogSearchDefaults } from '@features/catalog/schemas'
import type { AuthSearch } from '@features/auth/schemas'
import { SignInForm } from '@features/auth/sign-in-form'
import { SignUpForm } from '@features/auth/sign-up-form'
import { SocialButtons } from '@features/auth/social-buttons'
import { Alert, AlertTitle } from '@ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@ui/dialog'

export type AuthMode = 'login' | 'register'

type AuthScreenProps = {
  mode: AuthMode
  search: AuthSearch
  onAuthenticated: () => void
  onClose: () => void
}

const COPY: Record<AuthMode, { title: string; mobileTitle: string; description: string }> = {
  login: {
    title: 'Entrar',
    mobileTitle: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  },
  register: {
    title: 'Criar conta',
    mobileTitle: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
  },
}

const ModeTabs = ({ mode, search }: { mode: AuthMode; search: AuthSearch }) => (
  <nav aria-label="Entrar ou criar conta" className="flex items-center justify-center gap-2 text-lg">
    <Link
      to="/login"
      search={{ redirect: search.redirect }}
      replace
      className={cn('hover:text-primary', mode === 'login' && 'text-primary')}
    >
      Entrar
    </Link>
    <span aria-hidden="true" className="h-5 w-px bg-primary" />
    <Link
      to="/register"
      search={{ redirect: search.redirect }}
      replace
      className={cn('hover:text-primary', mode === 'register' && 'text-primary')}
    >
      Criar conta
    </Link>
  </nav>
)

const ExpiredNotice = () => (
  <Alert>
    <CircleAlertIcon />
    <AlertTitle>Sua sessão expirou. Entre novamente para continuar de onde parou.</AlertTitle>
  </Alert>
)

const AuthForm = ({ mode, onAuthenticated }: Pick<AuthScreenProps, 'mode' | 'onAuthenticated'>) =>
  mode === 'login' ? <SignInForm onSuccess={onAuthenticated} /> : <SignUpForm onSuccess={onAuthenticated} />

const ignoreSearchChange = () => undefined

export const AuthScreen = ({ mode, search, onAuthenticated, onClose }: AuthScreenProps) => {
  const desktop = useMediaQuery('(min-width: 768px)')
  const copy = COPY[mode]

  if (desktop) {
    return (
      <>
        <div inert aria-hidden="true" className="mx-auto flex w-full max-w-shop flex-col gap-16 px-6 pt-4">
          <HeroCarousel />
          <Catalog search={catalogSearchDefaults} onSearchChange={ignoreSearchChange} />
        </div>
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) onClose()
          }}
        >
          <DialogContent
            closeLabel="Fechar"
            className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto rounded-none border-b-8 border-primary bg-card px-14 pt-10 pb-8 sm:max-w-md"
          >
            <DialogTitle className="sr-only">{copy.title}</DialogTitle>
            <ModeTabs mode={mode} search={search} />
            <DialogDescription className="text-center text-[0.8125rem] text-foreground/90">{copy.description}</DialogDescription>
            {search.motivo === 'expirada' && <ExpiredNotice />}
            <AuthForm mode={mode} onAuthenticated={onAuthenticated} />
            <SocialButtons />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 pt-20 pb-10">
      <p className="text-center text-3xl font-bold tracking-[0.15em]">KURIO</p>
      <h1 className="mt-10 text-center text-lg font-bold">{copy.mobileTitle}</h1>
      {search.motivo === 'expirada' && <ExpiredNotice />}
      <AuthForm mode={mode} onAuthenticated={onAuthenticated} />
      <SocialButtons />
      <p className="text-center text-[0.8125rem] text-muted-foreground">
        {mode === 'login' ? (
          <Link to="/register" search={{ redirect: search.redirect }} replace className="hover:text-primary">
            Novo na Kurio? Crie uma conta
          </Link>
        ) : (
          <Link to="/login" search={{ redirect: search.redirect }} replace className="hover:text-primary">
            Já tem uma conta? Entre
          </Link>
        )}
      </p>
    </div>
  )
}
