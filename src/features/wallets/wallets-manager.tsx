import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { Wallets } from '@contracts/wallet'
import { walletsQuery } from '@core/queries'
import { ErrorState } from '@pattern/error-state'
import { emptyWalletValues, toWalletValues } from '@features/wallets/schemas'
import { WalletForm } from '@features/wallets/wallet-form'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Label } from '@ui/label'
import { Skeleton } from '@ui/skeleton'

const SecondaryWallet = ({ userId, wallets }: { userId: string; wallets: Wallets }) => {
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const source = sameAsPrimary && wallets.primary ? { ...toWalletValues(wallets.primary), nickname: 'Reserva' } : null
  const initialValues = source ?? (wallets.secondary ? toWalletValues(wallets.secondary) : emptyWalletValues)
  const showForm = adding || wallets.secondary !== null || source !== null

  return (
    <section aria-labelledby="carteira-secundaria" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="carteira-secundaria" className="text-[0.9375rem] font-semibold">
          Carteira secundária
        </h2>
        <div className="flex items-center gap-4">
          {wallets.primary && (
            <Label className="flex items-center gap-2 text-[0.8125rem] font-normal">
              <Checkbox
                checked={sameAsPrimary}
                onCheckedChange={(checked) => {
                  setSameAsPrimary(checked)
                }}
              />
              Igual à carteira principal
            </Label>
          )}
          {!showForm && (
            <Button
              variant="link"
              className="h-auto p-0 font-semibold"
              onClick={() => {
                setAdding(true)
              }}
            >
              Adicionar
            </Button>
          )}
        </div>
      </div>
      {showForm ? (
        <WalletForm key={JSON.stringify(initialValues)} userId={userId} role="secondary" initialValues={initialValues} />
      ) : (
        <p className="text-[0.8125rem] text-muted-foreground">Você ainda não adicionou uma carteira secundária.</p>
      )}
    </section>
  )
}

export const WalletsManager = ({ userId }: { userId: string }) => {
  const wallets = useQuery(walletsQuery(userId))
  if (wallets.isPending) {
    return (
      <div role="status" aria-label="Carregando carteiras" className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-16" />
        ))}
      </div>
    )
  }
  if (wallets.isError) {
    return (
      <ErrorState
        error={wallets.error}
        retrying={wallets.isFetching}
        onRetry={() => {
          void wallets.refetch()
        }}
      />
    )
  }
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="carteira-principal" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 id="carteira-principal" className="text-[0.9375rem] font-semibold">
            Carteira principal
          </h1>
          <p className="text-xs text-muted-foreground">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        </div>
        <WalletForm
          key={wallets.data.primary?.updatedAt ?? 'nova'}
          userId={userId}
          role="primary"
          initialValues={wallets.data.primary ? toWalletValues(wallets.data.primary) : emptyWalletValues}
        />
      </section>
      <SecondaryWallet userId={userId} wallets={wallets.data} />
    </div>
  )
}
