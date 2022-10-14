import { createVNode, VNodeDefaultProps, FC } from '@gyron/runtime'
import { extend } from '@gyron/shared'
import { To } from 'history'
import { useHref, useRouter } from './hooks'

interface LinkProps extends Partial<VNodeDefaultProps> {
  to: To
  replace?: boolean
  className?: string
  // hit class name
  activeClassName?: string
  // hit style
  activeStyle?: Record<string, string | number> | string
}

export const Link = FC<LinkProps>(function Link() {
  const router = useRouter()

  function handleClick(e: Event, { to, replace }: LinkProps) {
    e.preventDefault()
    if (replace) {
      router.replace(to)
    } else {
      router.push(to)
    }
  }

  return function Link({
    children,
    to,
    replace,
    activeClassName,
    activeStyle,
    className,
    ...args
  }) {
    const href = useHref(to)
    const props = {
      onClick: (e: Event) => handleClick(e, { to, replace }),
      class: className || '',
      href: href,
      ...args,
    }
    if (props.href === router.path) {
      extend(props, {
        class: `${activeClassName || ''} ${className || ''}`.replace(
          /(^\s|\s$)/,
          ''
        ),
        style: activeStyle || {},
      })
    }
    return createVNode('a', props, children)
  }
})
