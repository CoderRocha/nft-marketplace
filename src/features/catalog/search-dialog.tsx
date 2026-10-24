import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ui/dialog'
import { Input } from '@ui/input'

type SearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (query: string) => void
}

export const SearchDialog = ({ open, onOpenChange, onSearch }: SearchDialogProps) => {
  const [query, setQuery] = useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Fechar busca" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar NFTs</DialogTitle>
          <DialogDescription>Procure por nome, coleção, criador ou ID do token.</DialogDescription>
        </DialogHeader>
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch(query.trim())
            onOpenChange(false)
          }}
        >
          <label htmlFor="busca-global" className="sr-only">
            Termo de busca
          </label>
          <Input
            id="busca-global"
            type="search"
            autoFocus
            value={query}
            placeholder="Ex.: Emerald Ape"
            onChange={(event) => {
              setQuery(event.target.value)
            }}
          />
          <Button type="submit">
            <SearchIcon />
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
