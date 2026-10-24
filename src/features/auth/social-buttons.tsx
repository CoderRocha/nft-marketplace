import { FaFacebookF } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { toast } from 'sonner'
import { Button } from '@ui/button'

const PROVIDERS = [
  { name: 'Google', icon: <FcGoogle className="size-4" /> },
  { name: 'Facebook', icon: <FaFacebookF className="size-4 text-facebook" /> },
]

export const SocialButtons = () => (
  <div className="flex flex-col gap-3">
    <p className="flex items-center gap-3 text-xs text-foreground/90 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
      Ou continue com
    </p>
    {PROVIDERS.map((provider) => (
      <Button
        key={provider.name}
        type="button"
        variant="outline"
        className="border-border font-normal"
        onClick={() => {
          toast.info(`Entrar com ${provider.name} não está disponível nesta demonstração. Use e-mail e senha.`)
        }}
      >
        {provider.icon}
        Continuar com {provider.name}
      </Button>
    ))}
  </div>
)
