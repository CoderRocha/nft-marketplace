import { ImageIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '@contracts/profile'
import { isFriendlyError } from '@core/http'
import { useRemoveAvatar, useUploadAvatar } from '@features/profile/hooks'
import { Button } from '@ui/button'

type AvatarFieldProps = {
  userId: string
  avatarUrl: string | null
}

const localError = (file: File) => {
  if (!AVATAR_TYPES.some((type) => type === file.type)) return 'Envie uma imagem PNG, JPG ou WebP.'
  if (file.size > AVATAR_MAX_BYTES) return 'A imagem precisa ter até 1 MB.'
  return null
}

export const AvatarField = ({ userId, avatarUrl }: AvatarFieldProps) => {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const upload = useUploadAvatar(userId)
  const remove = useRemoveAvatar(userId)
  const busy = upload.isPending || remove.isPending

  const onFailure = (failure: unknown) => {
    setError(isFriendlyError(failure) ? (failure.fieldErrors.avatar?.[0] ?? failure.title) : 'Não foi possível atualizar o avatar.')
  }

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-sm font-medium">
        Avatar
      </span>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-secondary text-primary">
          {avatarUrl ? <img src={avatarUrl} alt="Seu avatar atual" className="size-full object-cover" /> : <ImageIcon aria-hidden="true" className="size-5" />}
        </span>
        <input
          ref={input}
          id={`${id}-file`}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          aria-label="Escolher imagem de avatar"
          aria-describedby={error ? `${id}-error` : undefined}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            const invalid = localError(file)
            setError(invalid)
            if (invalid) return
            upload.mutate(file, {
              onSuccess: () => {
                toast.success('Avatar atualizado.')
              },
              onError: onFailure,
            })
          }}
        />
        <Button
          size="sm"
          className="h-8 px-4"
          disabled={busy}
          onClick={() => {
            input.current?.click()
          }}
        >
          {upload.isPending ? 'Enviando' : 'Alterar'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          disabled={busy || !avatarUrl}
          onClick={() => {
            setError(null)
            remove.mutate(undefined, {
              onSuccess: () => {
                toast.success('Avatar removido.')
              },
              onError: onFailure,
            })
          }}
        >
          Remover
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
