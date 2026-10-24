import { useSelector } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from 'cn'
import { ChevronLeftIcon } from 'lucide-react'
import { useState } from 'react'
import * as v from 'valibot'
import type { Cart } from '@contracts/cart'
import { NETWORKS } from '@contracts/nft'
import { collectorInputSchema, quoteOutdatedSchema, walletConnectionInputSchema, type WalletSource } from '@contracts/order'
import type { Profile } from '@contracts/profile'
import { WALLET_PROVIDERS, isValidAddress, type Wallet, type Wallets } from '@contracts/wallet'
import { fetchQuote, updateCartItem } from '@core/api/cart'
import { readDraft, saveAttempt, saveDraft } from '@core/checkout-attempt'
import { isFriendlyError } from '@core/http'
import { keys } from '@core/keys'
import { multiplyEth } from '@core/money'
import { cartQuery, quoteQuery } from '@core/queries'
import { useCartOwner } from '@core/session'
import { createFormSubmitHandler, schemaValidation, useAppForm } from '@pattern/form.hooks'
import { CouponForm } from '@features/cart/coupon-form'
import { useQuote } from '@features/cart/hooks'
import { usePlaceOrder, useWalletConnection, type CheckoutReview } from '@features/checkout/hooks'
import { ItemsList, TotalsList, type SummaryItem } from '@features/checkout/order-summary-parts'
import { ReviewDialog } from '@features/checkout/review-dialog'
import { collectorDefaults, collectorFormSchema, mergeDraft, walletFieldValues, type CheckoutSearch } from '@features/checkout/schemas'
import { ProviderPicker, WalletPicker } from '@features/checkout/wallet-pickers'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Label } from '@ui/label'
import { Skeleton } from '@ui/skeleton'

const NETWORK_OPTIONS = NETWORKS.map((network) => ({ value: network.id, label: network.label }))

const PROVIDER_OPTIONS = WALLET_PROVIDERS.map((provider) => ({ value: provider.id, label: provider.label }))

const WALLET_FIELDS = ['network', 'profileName', 'address', 'ensOrSecondary', 'provider', 'referralCode'] as const

const CUSTOM_WALLET_NICKNAME = 'Outra carteira'

const describeError = (error: unknown) =>
  isFriendlyError(error) ? [error.title, error.detail].filter(Boolean).join('. ') : 'Não foi possível concluir o pedido.'

const toSummaryItems = (cart: Cart): SummaryItem[] =>
  cart.lines.map((line) => ({
    key: line.id,
    name: line.nft.name,
    tokenId: line.nft.tokenId,
    editionLabel: line.edition.label,
    quantity: line.quantity,
    lineTotal: multiplyEth(line.edition.price, line.quantity),
    image: line.nft.image,
  }))

type CheckoutFormProps = {
  userId: string
  profile: Profile
  wallets: Wallets
  cart: Cart
  step: CheckoutSearch['etapa']
  onStepChange: (step: CheckoutSearch['etapa']) => void
}

export const CheckoutForm = ({ userId, profile, wallets, cart, step, onStepChange }: CheckoutFormProps) => {
  const queryClient = useQueryClient()
  const owner = useCartOwner()
  const initialSource: WalletSource = wallets.primary ? 'primary' : wallets.secondary ? 'secondary' : 'custom'
  const [walletSource, setWalletSource] = useState<WalletSource>(initialSource)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [review, setReview] = useState<CheckoutReview | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [couponOpen, setCouponOpen] = useState(cart.couponCode !== null)
  const { connection, connect, disconnect } = useWalletConnection()
  const { placeOrder, verifying } = usePlaceOrder(userId)
  const quote = useQuote(cart)

  const walletFor = (source: WalletSource): Wallet | null =>
    source === 'primary' ? wallets.primary : source === 'secondary' ? wallets.secondary : null

  const form = useAppForm({
    defaultValues: mergeDraft(collectorDefaults(profile, walletFor(initialSource)), readDraft(userId)),
    ...schemaValidation(collectorFormSchema),
    listeners: {
      onChange: ({ formApi }) => {
        saveDraft(userId, formApi.state.values)
      },
      onChangeDebounceMs: 300,
    },
    onSubmit: createFormSubmitHandler(collectorFormSchema, async (values) => {
      if (!connected) {
        setConnectionError('Conecte a carteira antes de confirmar a compra.')
        onStepChange('carteira')
        return
      }
      const freshQuote = await queryClient.query({ ...quoteQuery(owner, cart.updatedAt), staleTime: 0 })
      setOrderError(null)
      setReview({
        quote: freshQuote,
        previousQuote: null,
        collector: v.parse(collectorInputSchema, { ...values, nickname: walletFor(walletSource)?.nickname ?? CUSTOM_WALLET_NICKNAME }),
        walletSource,
        connection,
      })
    }),
  })

  const values = useSelector(form.store, (state) => state.values)
  const connected =
    connection !== null &&
    connection.provider === values.provider &&
    connection.network === values.network &&
    connection.address === values.address.trim()

  const selectWallet = (source: WalletSource, wallet: Wallet | null) => {
    setWalletSource(source)
    const fields = walletFieldValues(wallet)
    for (const field of WALLET_FIELDS) form.setFieldValue(field, fields[field])
  }

  const onConnect = () => {
    const input = v.safeParse(walletConnectionInputSchema, {
      provider: values.provider,
      network: values.network,
      address: values.address.trim(),
    })
    if (!input.success || !isValidAddress(input.output.network, input.output.address)) {
      setConnectionError('Preencha rede, endereço e tipo de carteira válidos para conectar.')
      return
    }
    setConnectionError(null)
    connect.mutate(input.output, {
      onError: (error) => {
        setConnectionError(describeError(error))
      },
    })
  }

  const acceptChanges = useMutation({
    mutationFn: async (current: CheckoutReview) => {
      let updatedCart = cart
      for (const issue of current.quote.issues) {
        if (issue.kind === 'price_changed') updatedCart = await updateCartItem(issue.lineId, { acceptPrice: true })
      }
      queryClient.setQueryData(cartQuery(owner).queryKey, updatedCart)
      return fetchQuote()
    },
    onSuccess: (freshQuote, current) => {
      setReview({ ...current, quote: freshQuote, previousQuote: current.previousQuote ?? current.quote })
    },
    onError: (error) => {
      setOrderError(describeError(error))
    },
  })

  const confirmOrder = (current: CheckoutReview) => {
    setOrderError(null)
    placeOrder.mutate(current, {
      onError: (error) => {
        const outdated = isFriendlyError(error) ? v.safeParse(quoteOutdatedSchema, error.payload) : null
        if (outdated?.success) {
          setReview({ ...current, quote: outdated.output.quote, previousQuote: current.quote })
          void queryClient.invalidateQueries({ queryKey: keys.cart._def })
          return
        }
        if (isFriendlyError(error) && error.code === 'idempotency_conflict') saveAttempt(userId, null)
        setOrderError(describeError(error))
      },
    })
  }

  return (
    <form
      noValidate
      aria-label="Pagamento"
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-12"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppForm>
        <section aria-labelledby="colecionador-titulo" className={cn('flex flex-col gap-5', step === 'carteira' && 'max-md:hidden')}>
          <h2 id="colecionador-titulo" className="text-[0.9375rem] font-semibold">
            Perfil do colecionador
          </h2>
          <form.FormErrorAlert />
          <div className="grid gap-5 md:grid-cols-2">
            <form.AppField name="displayName">{(field) => <field.TextField label="Nome de exibição" required autoComplete="name" />}</form.AppField>
            <form.AppField name="username">{(field) => <field.TextField label="Nome de usuário" required autoComplete="username" />}</form.AppField>
            <form.AppField name="network">
              {(field) => <field.SelectField label="Rede" required options={NETWORK_OPTIONS} placeholder="Selecione uma rede" />}
            </form.AppField>
            <form.AppField name="profileName">{(field) => <field.TextField label="Nome do perfil" required />}</form.AppField>
            <form.AppField name="address">
              {(field) => <field.TextField label="Endereço da carteira" required placeholder="Endereço 0x da carteira" />}
            </form.AppField>
            <form.AppField name="ensOrSecondary">
              {(field) => (
                <field.TextField label="ENS ou carteira secundária (opcional)" placeholder="ENS ou carteira secundária (opcional)" />
              )}
            </form.AppField>
            <form.AppField name="provider">
              {(field) => <field.SelectField label="Tipo de carteira" required options={PROVIDER_OPTIONS} placeholder="Selecione uma carteira" />}
            </form.AppField>
            <form.AppField name="referralCode">{(field) => <field.TextField label="Código de indicação" required />}</form.AppField>
            <form.AppField name="email">{(field) => <field.TextField label="E-mail" type="email" required autoComplete="email" />}</form.AppField>
            <form.AppField name="ensName">{(field) => <field.TextField label="Nome ENS" required prefix=".eth" />}</form.AppField>
          </div>
          <Label className="flex w-fit items-center gap-2 font-normal">
            <Checkbox
              checked={walletSource === 'custom'}
              onCheckedChange={(checked) => {
                const source: WalletSource = checked ? 'custom' : initialSource
                selectWallet(source, walletFor(source))
              }}
            />
            Usar outra carteira?
          </Label>
          <div className="md:max-w-[calc(50%-0.625rem)]">
            <form.AppField name="note">
              {(field) => <field.TextareaField label="Observação do colecionador (opcional)" rows={5} />}
            </form.AppField>
          </div>
          <Button
            type="button"
            size="lg"
            className="h-14 rounded-full bg-linear-to-r from-primary to-primary-deep md:hidden"
            onClick={() => {
              void form.validateAllFields('submit').then(() => {
                if (form.state.isFieldsValid) onStepChange('carteira')
              })
            }}
          >
            Continuar
          </Button>
        </section>

        <aside aria-label="Resumo e carteira" className={cn('flex flex-col gap-6', step === 'dados' && 'max-md:hidden')}>
          <div className="flex items-center gap-4 md:hidden">
            <button
              type="button"
              aria-label="Voltar aos dados do colecionador"
              onClick={() => {
                onStepChange('dados')
              }}
              className="flex size-10 items-center justify-center rounded-full border border-primary/40"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <h2 className="text-lg font-bold">Pagamento com carteira</h2>
          </div>
          <section aria-labelledby="seus-nfts" className="flex flex-col gap-4">
            <h2 id="seus-nfts" className="text-[0.9375rem] font-semibold">
              Seus NFTs
            </h2>
            <ItemsList items={toSummaryItems(cart)} />
            {couponOpen ? (
              <CouponForm appliedCode={cart.couponCode} appliedPercent={quote.data?.coupon?.percent} />
            ) : (
              <button
                type="button"
                className="text-center text-[0.8125rem] hover:text-primary"
                onClick={() => {
                  setCouponOpen(true)
                }}
              >
                Tem um código promocional? <span className="text-primary">Aplique aqui</span>
              </button>
            )}
            {quote.data ? (
              <TotalsList
                subtotal={quote.data.subtotal}
                discount={quote.data.discount}
                networkFee={quote.data.networkFee}
                total={quote.data.total}
              />
            ) : (
              <Skeleton className="h-28" />
            )}
          </section>
          <WalletPicker wallets={wallets} value={walletSource} onChange={selectWallet} />
          <ProviderPicker
            value={values.provider}
            onChange={(provider) => {
              form.setFieldValue('provider', provider)
            }}
            connection={connection}
            connected={connected}
            connecting={connect.isPending}
            error={connectionError}
            onConnect={onConnect}
            onDisconnect={() => {
              if (connection) disconnect.mutate(connection.id)
            }}
          />
          <form.SubmitButton className="h-14 w-full rounded-full bg-linear-to-r from-primary to-primary-deep md:h-11 md:rounded-md md:bg-none">
            Confirmar compra
          </form.SubmitButton>
        </aside>
      </form.AppForm>
      <ReviewDialog
        review={review}
        items={toSummaryItems(cart)}
        submitting={placeOrder.isPending}
        verifying={verifying}
        accepting={acceptChanges.isPending}
        error={orderError}
        onConfirm={() => {
          if (review) confirmOrder(review)
        }}
        onAcceptChanges={() => {
          if (review) acceptChanges.mutate(review)
        }}
        onClose={() => {
          setReview(null)
        }}
      />
    </form>
  )
}
