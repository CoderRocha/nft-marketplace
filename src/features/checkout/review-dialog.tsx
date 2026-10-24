import { Link } from '@tanstack/react-router'
import { CircleAlertIcon, LoaderCircleIcon } from 'lucide-react'
import { formatEthLabel } from '@core/money'
import type { CheckoutReview } from '@features/checkout/hooks'
import { ItemsList, TotalsList, type SummaryItem } from '@features/checkout/order-summary-parts'
import { networkLabel, shortAddress } from '@features/checkout/wallet-pickers'
import { Alert, AlertDescription, AlertTitle } from '@ui/alert'
import { Button, buttonVariants } from '@ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'

type ReviewDialogProps = {
  review: CheckoutReview | null
  items: SummaryItem[]
  submitting: boolean
  verifying: boolean
  accepting: boolean
  error: string | null
  onConfirm: () => void
  onAcceptChanges: () => void
  onClose: () => void
}

export const ReviewDialog = ({ review, items, submitting, verifying, accepting, error, onConfirm, onAcceptChanges, onClose }: ReviewDialogProps) => {
  const issues = review?.quote.issues ?? []
  const onlyPriceChanges = issues.length > 0 && issues.every((issue) => issue.kind === 'price_changed')
  const blockedByStock = issues.some((issue) => issue.kind !== 'price_changed')
  const busy = submitting || accepting

  return (
    <Dialog
      open={review !== null}
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent closeLabel="Fechar revisão" className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Revise seu pedido</DialogTitle>
          <DialogDescription>Confira os itens, a carteira e os valores antes de enviar o pagamento.</DialogDescription>
        </DialogHeader>
        {review && (
          <>
            {review.previousQuote && (
              <Alert>
                <CircleAlertIcon />
                <AlertTitle>Os valores do pedido mudaram</AlertTitle>
                <AlertDescription>
                  O total passou de {formatEthLabel(review.previousQuote.total)} para {formatEthLabel(review.quote.total)}. Confirme
                  novamente para continuar.
                </AlertDescription>
              </Alert>
            )}
            {issues.length > 0 && (
              <ul className="flex flex-col gap-2 text-[0.8125rem] text-warning">
                {issues.map((issue) => (
                  <li key={`${issue.lineId}-${issue.kind}`} role="status">
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
            <ItemsList items={items} />
            <dl className="grid gap-1 rounded-md border border-border p-3 text-[0.8125rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Carteira</dt>
                <dd>
                  {review.collector.nickname} · {shortAddress(review.connection.address)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Rede</dt>
                <dd>{networkLabel(review.connection.network)}</dd>
              </div>
            </dl>
            <TotalsList
              subtotal={review.quote.subtotal}
              discount={review.quote.discount}
              networkFee={review.quote.networkFee}
              total={review.quote.total}
            />
            {verifying && (
              <p role="status" className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
                <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                Verificando o pedido. A conexão demorou, estamos confirmando sem criar uma nova compra.
              </p>
            )}
            {error && (
              <p role="alert" className="text-[0.8125rem] text-destructive">
                {error}
              </p>
            )}
          </>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={busy} onClick={onClose}>
            Voltar
          </Button>
          {blockedByStock ? (
            <Link to="/cart" className={buttonVariants()}>
              Revisar carrinho
            </Link>
          ) : onlyPriceChanges ? (
            <Button disabled={busy} onClick={onAcceptChanges}>
              {accepting ? 'Atualizando valores' : 'Aceitar novos valores'}
            </Button>
          ) : (
            <Button disabled={busy} onClick={onConfirm}>
              {submitting ? 'Enviando pagamento' : 'Confirmar e pagar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
