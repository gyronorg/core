import {
  cloneVNode,
  createText,
  FC,
  getCurrentComponent,
  provide,
} from '@gyron/runtime'
import { TypeOutlet, TypeOutletRaw, useOutlet, useRouter } from './hooks'

export const Outlet = FC(function Outlet() {
  const component = getCurrentComponent()
  const router = useRouter()
  const route = useOutlet()

  if (!route) {
    // Render an empty text node placeholder when there is no child route
    return createText('')
  }

  return route.matches.map((route) => {
    const props: TypeOutletRaw = {
      matches: route.extra.matched,
      depth: route.extra.depth,
    }
    provide(component, TypeOutlet, props)

    const {
      element,
      regexpPath,
      matchFromRedirect: shouldRedirect,
    } = route.extra

    if (shouldRedirect) {
      // If the current branch is redirected from a Redirect component, the route needs to be updated
      router.replaceState(regexpPath, {
        redirect: regexpPath,
      })
    }

    return cloneVNode(element)
  })
})
