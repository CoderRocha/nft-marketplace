import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog'

export const ExplorerDialog = ({ hash }: { hash: string }) => (
  <Dialog>
    <DialogTrigger render={<Button size="lg" className="mx-auto h-10 px-4 text-sm" />}>Ver no Etherscan</DialogTrigger>
    <DialogContent closeLabel="Fechar" className="bg-card sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Transação simulada</DialogTitle>
        <DialogDescription>
          Este pedido foi confirmado em um ambiente de demonstração. A transação não existe em uma rede real, então não há página no
          explorador de blocos.
        </DialogDescription>
      </DialogHeader>
      <p className="rounded-md bg-field p-3 font-mono text-xs break-all">{hash}</p>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            void navigator.clipboard
              .writeText(hash)
              .then(() => toast.success('Identificador da transação copiado.'))
              .catch(() => toast.error('Não foi possível copiar. Selecione o texto manualmente.'))
          }}
        >
          <CopyIcon />
          Copiar identificador
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
