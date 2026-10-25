import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import * as v from 'valibot'
import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from '@contracts/mocks'
import { applyMockScenario, resetMocks } from '@core/api/mocks'
import { MOCKS_ENABLED } from '@core/constants'
import { mockStateQuery } from '@core/queries'
import { Button } from '@ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'
import { Label } from '@ui/label'
import { RadioGroup, RadioGroupItem } from '@ui/radio-group'

const OPEN_PARAM = 'cenarios'

const SCENARIO_PARAM = 'cenario'

const reloadWithoutScenarioParam = () => {
  const url = new URL(window.location.href)
  url.searchParams.delete(SCENARIO_PARAM)
  window.location.replace(url)
}

const isShortcut = (event: KeyboardEvent) => (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k'

export const ScenarioDialog = () => {
  const router = useRouter()
  const [open, setOpen] = useState(() => MOCKS_ENABLED && new URL(window.location.href).searchParams.has(OPEN_PARAM))
  const [selected, setSelected] = useState<ScenarioId | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const state = useQuery({ ...mockStateQuery(), enabled: MOCKS_ENABLED && open })
  const apply = useMutation({ mutationFn: applyMockScenario, onSuccess: reloadWithoutScenarioParam })
  const reset = useMutation({ mutationFn: resetMocks, onSuccess: reloadWithoutScenarioParam })
  const current = selected ?? state.data?.scenario ?? 'padrao'
  const busy = apply.isPending || reset.isPending

  const changeOpen = (next: boolean) => {
    if (next) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    else setSelected(null)
    setOpen(next)
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(OPEN_PARAM)) return
    url.searchParams.delete(OPEN_PARAM)
    router.history.replace(`${url.pathname}${url.search}${url.hash}`)
  }, [router])

  useEffect(() => {
    if (!MOCKS_ENABLED) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isShortcut(event)) return
      event.preventDefault()
      if (open) setSelected(null)
      else returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setOpen(!open)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!MOCKS_ENABLED) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) changeOpen(next)
      }}
    >
      <DialogContent closeLabel="Fechar cenários" finalFocus={returnFocus} className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cenários de teste</DialogTitle>
          <DialogDescription>
            Simule latência, falhas e desfechos de compra. O cenário fica salvo neste navegador até ser trocado ou restaurado. Atalho: Ctrl + K.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          aria-label="Cenário"
          value={current}
          onValueChange={(value) => {
            if (v.is(v.picklist(SCENARIO_IDS), value)) setSelected(value)
          }}
          className="gap-1"
        >
          {SCENARIOS.map((scenario) => (
            <Label
              key={scenario.id}
              className="flex cursor-pointer items-start gap-3 rounded-md p-3 font-normal hover:bg-secondary has-data-checked:bg-secondary"
            >
              <RadioGroupItem value={scenario.id} className="mt-0.5" />
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{scenario.label}</span>
                <span className="text-xs text-muted-foreground">{scenario.description}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
        <DialogFooter className="bg-card sm:justify-between">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              reset.mutate(current)
            }}
          >
            Restaurar dados
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <DialogClose render={<Button variant="outline" disabled={busy} />}>Cancelar</DialogClose>
            <Button
              disabled={busy}
              onClick={() => {
                apply.mutate(current)
              }}
            >
              Aplicar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
