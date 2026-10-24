import { useMutation, useQuery } from '@tanstack/react-query'
import { FlaskConicalIcon } from 'lucide-react'
import { useState } from 'react'
import * as v from 'valibot'
import { SCENARIOS, SCENARIO_IDS, type ScenarioId } from '@contracts/mocks'
import { applyMockScenario, resetMocks } from '@core/api/mocks'
import { MOCKS_ENABLED } from '@core/constants'
import { mockStateQuery } from '@core/queries'
import { Button } from '@ui/button'
import { Label } from '@ui/label'
import { RadioGroup, RadioGroupItem } from '@ui/radio-group'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@ui/sheet'

const reloadPage = () => {
  window.location.reload()
}

export const ScenarioPanel = () => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ScenarioId | null>(null)
  const state = useQuery({ ...mockStateQuery(), enabled: open })
  const apply = useMutation({ mutationFn: applyMockScenario, onSuccess: reloadPage })
  const reset = useMutation({ mutationFn: resetMocks, onSuccess: reloadPage })
  const current = selected ?? state.data?.scenario ?? 'padrao'
  const busy = apply.isPending || reset.isPending

  if (!MOCKS_ENABLED) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="link" size="sm" className="h-auto p-0 text-xs text-muted-foreground" />}>
        <FlaskConicalIcon />
        Cenários de teste
      </SheetTrigger>
      <SheetContent side="right" closeLabel="Fechar cenários" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cenários de teste</SheetTitle>
          <SheetDescription>
            Simule latência, falhas e desfechos de compra. O cenário fica salvo neste navegador até ser trocado ou restaurado.
          </SheetDescription>
        </SheetHeader>
        <RadioGroup
          aria-label="Cenário"
          value={current}
          onValueChange={(value) => {
            if (v.is(v.picklist(SCENARIO_IDS), value)) setSelected(value)
          }}
          className="gap-1 px-4"
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
        <SheetFooter>
          <Button
            disabled={busy}
            onClick={() => {
              apply.mutate(current)
            }}
          >
            Aplicar e recarregar
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              reset.mutate(current)
            }}
          >
            Restaurar dados e recarregar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
