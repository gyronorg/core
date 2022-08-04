/* eslint-disable @typescript-eslint/ban-ts-comment */
import { isFunction } from '@gyron/shared'
import {
  useValue,
  Primitive,
  onAfterMount,
  onAfterUpdate,
  getCurrentComponent,
  FC,
  ComponentSetupFunction,
  VNode,
  WrapperFunction,
  useWatch,
  isResponsive,
} from '@gyron/runtime'

export function useState<S>(
  initialState: S | (() => S)
): [Primitive<S>, React.Dispatch<React.SetStateAction<S>>] {
  let prevState: S
  if (isFunction(initialState)) {
    prevState = initialState()
  } else {
    prevState = initialState
  }
  const state = useValue(prevState)
  return [
    state,
    (nextState) => {
      let nextRealState: S
      if (isFunction(nextState)) {
        nextRealState = nextState(state.value)
      } else {
        nextRealState = nextState
      }
      state.value = nextRealState
    },
  ]
}

export function useEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const component = getCurrentComponent()
  const effectProxy = new Proxy(effect, {
    apply(target, that, args) {
      const ret = target.apply(that, args)
      if (isFunction(ret)) {
        component.lifecycle.destroyed.add(ret)
      }
      return ret
    },
  })

  if (deps) {
    useWatch(
      effectProxy,
      deps.map((dep) => {
        if (isResponsive(dep)) {
          return () => dep.value
        }
        return () => dep
      })
    )
  } else {
    onAfterMount(effectProxy)
    onAfterUpdate(effectProxy)
  }
}

export interface Context<T> {
  Provider: WrapperFunction<ComponentSetupFunction<{ value: T }>, { value: T }>
  Consumer: WrapperFunction<ComponentSetupFunction<{ value: T }>, { value: T }>
  displayName?: string | undefined
  get value(): T
}

export function createContext<T>(defaultValue: T): Context<T> {
  const context = useValue(null)
  const Provider = FC<{ value: any }>((props) => {
    context.value = props.value
    return props.children
  })
  const Consumer = FC((props) => {
    const value = context.value || defaultValue
    if (isFunction(props.children)) {
      return props.children(value)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const wrapper = (props.children as VNode).type as Function
    return wrapper(context.value || defaultValue)
  })
  return {
    Provider: Provider,
    Consumer: Consumer,
    get value() {
      return context.value
    },
  }
}

export function useContext<T>(context: Context<T>): T {
  return context.value
}
