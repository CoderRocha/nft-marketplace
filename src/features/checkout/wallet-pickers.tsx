import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { CircleCheckIcon, TriangleAlertIcon, WalletIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { NETWORKS } from '@contracts/nft'
import type { WalletConnection, WalletSource } from '@contracts/order'
import { WALLET_PROVIDERS, type Wallet, type Wallets } from '@contracts/wallet'
import { Button } from '@ui/button'

export const shortAddress = (address: string) => (address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address)

export const networkLabel = (network: string) => NETWORKS.find((candidate) => candidate.id === network)?.label ?? network

const optionClassName =
  'flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors has-checked:border-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50 md:rounded-sm md:bg-transparent'

const radioClassName = 'size-4 shrink-0 accent-primary'

type WalletPickerProps = {
  wallets: Wallets
  value: WalletSource
  onChange: (source: WalletSource, wallet: Wallet | null) => void
}

const describeWallet = (wallet: Wallet) =>
  `${wallet.ensOrSecondary || shortAddress(wallet.address)} · Rede ${networkLabel(wallet.network)}`

export const WalletPicker = ({ wallets, value, onChange }: WalletPickerProps) => {
  const options = [
    wallets.primary && { source: 'primary' as const, wallet: wallets.primary },
    wallets.secondary && { source: 'secondary' as const, wallet: wallets.secondary },
  ].flatMap((option) => (option ? [option] : []))

  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <legend className="text-[0.9375rem] font-semibold">Carteira conectada</legend>
        <Link to="/profile/wallets" className="text-[0.8125rem] font-semibold text-primary hover:underline">
          Trocar carteira
        </Link>
      </div>
      {options.map(({ source, wallet }) => (
        <label key={source} className={optionClassName}>
          <input
            type="radio"
            name="carteira"
            value={source}
            checked={value === source}
            onChange={() => {
              onChange(source, wallet)
            }}
            className={radioClassName}
          />
          <span className="flex min-w-0 flex-col">
            <span className="font-semibold">{wallet.nickname}</span>
            <span className="truncate text-xs text-muted-foreground">{describeWallet(wallet)}</span>
          </span>
        </label>
      ))}
      <label className={optionClassName}>
        <input
          type="radio"
          name="carteira"
          value="custom"
          checked={value === 'custom'}
          onChange={() => {
            onChange('custom', null)
          }}
          className={radioClassName}
        />
        <span className="flex flex-col">
          <span className="font-semibold">Outra carteira</span>
          <span className="text-xs text-muted-foreground">Informe o endereço nos dados do colecionador.</span>
        </span>
      </label>
    </fieldset>
  )
}

const PROVIDER_BADGES: Record<string, ReactNode> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: <WalletIcon className="size-4" />,
}

type ProviderPickerProps = {
  value: string
  onChange: (provider: string) => void
  connection: WalletConnection | null
  connected: boolean
  connecting: boolean
  error: string | null
  onConnect: () => void
  onDisconnect: () => void
}

export const ProviderPicker = ({ value, onChange, connection, connected, connecting, error, onConnect, onDisconnect }: ProviderPickerProps) => (
  <fieldset className="flex flex-col gap-3">
    <legend className="mb-3 text-[0.9375rem] font-semibold">Carteira e rede</legend>
    {WALLET_PROVIDERS.map((provider) => (
      <label key={provider.id} className={cn(optionClassName, 'justify-between')}>
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-primary"
          >
            {PROVIDER_BADGES[provider.id]}
          </span>
          {provider.label}
        </span>
        <input
          type="radio"
          name="provedor"
          value={provider.id}
          checked={value === provider.id}
          onChange={() => {
            onChange(provider.id)
          }}
          className={radioClassName}
        />
      </label>
    ))}
    <div aria-live="polite" className="flex flex-col gap-2 text-[0.8125rem]">
      {connected && connection ? (
        <p className="flex items-center gap-2 text-success">
          <CircleCheckIcon aria-hidden="true" className="size-4" />
          Conectada: {shortAddress(connection.address)} na rede {networkLabel(connection.network)}
        </p>
      ) : (
        <p className="text-muted-foreground">Conecte a carteira escolhida para liberar o pagamento.</p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-2 text-destructive">
          <TriangleAlertIcon aria-hidden="true" className="size-4" />
          {error}
        </p>
      )}
    </div>
    {connected ? (
      <Button type="button" variant="outline" className="w-fit" onClick={onDisconnect}>
        Desconectar carteira
      </Button>
    ) : (
      <Button type="button" variant="outline" className="w-fit" disabled={connecting || value === ''} onClick={onConnect}>
        {connecting ? 'Conectando' : 'Conectar carteira'}
      </Button>
    )}
  </fieldset>
)
