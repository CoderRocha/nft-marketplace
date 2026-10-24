import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { AddCartItemInput, Cart } from '@contracts/cart'
import { addCartItem, applyCoupon, removeCartItem, removeCoupon, updateCartItem } from '@core/api/cart'
import { isFriendlyError } from '@core/http'
import { cartQuery, quoteQuery } from '@core/queries'
import { useCartOwner } from '@core/session'

const errorMessage = (error: unknown, fallback: string) =>
  isFriendlyError(error) ? (error.detail ?? error.title) : fallback

const withLines = (cart: Cart, lines: Cart['lines']): Cart => ({
  ...cart,
  lines,
  itemCount: lines.reduce((total, line) => total + line.quantity, 0),
})

export const useCart = () => useQuery(cartQuery(useCartOwner()))

export const useQuote = (cart: Cart | undefined) => {
  const owner = useCartOwner()
  return useQuery({ ...quoteQuery(owner, cart?.updatedAt ?? ''), enabled: cart !== undefined && cart.lines.length > 0 })
}

const useCartCache = () => {
  const queryClient = useQueryClient()
  const { queryKey } = cartQuery(useCartOwner())
  return {
    queryClient,
    queryKey,
    setCart: (cart: Cart) => {
      queryClient.setQueryData(queryKey, cart)
    },
  }
}

export const useAddToCart = () => {
  const { setCart } = useCartCache()
  const navigate = useNavigate()
  const add = useMutation({ mutationFn: addCartItem, onSuccess: setCart })
  const run = (input: AddCartItemInput, { name, goToCart }: { name: string; goToCart: boolean }) => {
    add.mutate(input, {
      onSuccess: () => {
        if (goToCart) {
          void navigate({ to: '/cart' })
          return
        }
        toast.success(`${name} foi adicionado ao carrinho.`, {
          action: {
            label: 'Ver carrinho',
            onClick: () => {
              void navigate({ to: '/cart' })
            },
          },
        })
      },
      onError: (error) => {
        toast.error(errorMessage(error, 'Não foi possível adicionar ao carrinho.'))
      },
    })
  }
  return { run, pending: add.isPending }
}

export const useUpdateCartQuantity = () => {
  const { queryClient, queryKey, setCart } = useCartCache()
  return useMutation({
    mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) => updateCartItem(lineId, { quantity }),
    onMutate: async ({ lineId, quantity }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      if (previous) {
        setCart(withLines(previous, previous.lines.map((line) => (line.id === lineId ? { ...line, quantity } : line))))
      }
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous) setCart(context.previous)
      toast.error(errorMessage(error, 'Não foi possível alterar a quantidade.'))
    },
    onSuccess: setCart,
  })
}

export const useRemoveCartLine = () => {
  const { queryClient, queryKey, setCart } = useCartCache()
  return useMutation({
    mutationFn: ({ lineId }: { lineId: string; name: string }) => removeCartItem(lineId),
    onMutate: async ({ lineId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      if (previous) setCart(withLines(previous, previous.lines.filter((line) => line.id !== lineId)))
      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous) setCart(context.previous)
      toast.error(errorMessage(error, 'Não foi possível remover o item.'))
    },
    onSuccess: (cart, { name }) => {
      setCart(cart)
      toast.success(`${name} saiu do carrinho.`)
    },
  })
}

export const useAcceptPrice = () => {
  const { setCart } = useCartCache()
  return useMutation({
    mutationFn: (lineId: string) => updateCartItem(lineId, { acceptPrice: true }),
    onSuccess: setCart,
    onError: (error) => {
      toast.error(errorMessage(error, 'Não foi possível atualizar o preço.'))
    },
  })
}

export const useApplyCoupon = () => {
  const { setCart } = useCartCache()
  return useMutation({ mutationFn: applyCoupon, onSuccess: setCart })
}

export const useRemoveCoupon = () => {
  const { setCart } = useCartCache()
  return useMutation({ mutationFn: removeCoupon, onSuccess: setCart })
}
