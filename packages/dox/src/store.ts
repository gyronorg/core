import {
  createPlugin,
  enableTrack,
  pauseTrack,
  useReactive,
  usePlugin,
  FC,
} from '@gyron/runtime'
import { extend, isFunction, readonly, readwrite } from '@gyron/shared'
import { sync } from '@gyron/sync'
import {
  Action,
  AnyAction,
  configureStore,
  ConfigureStoreOptions,
  EnhancedStore,
  Middleware,
} from '@reduxjs/toolkit'
import { ThunkMiddlewareFor } from '@reduxjs/toolkit/src/getDefaultMiddleware'
import { default as clone } from 'clone'

export type Middlewares<S> = ReadonlyArray<Middleware<object, S>>

export interface ProviderProps {
  store: ReturnType<typeof createStore>
}

export interface StorePlugin<S = any> {
  store: EnhancedStore
  state: S
  getStore: () => EnhancedStore
  getState: () => S
}

const TypeStore = Symbol.for('gyron.store')

function getStoreWithContext() {
  const context = usePlugin()
  const store = context.get<StorePlugin>(TypeStore)
  if (!store) {
    throw new Error(
      'Please use(store) to register the store, and then use the hook function provided by dox'
    )
  }
  return store
}

export function useDispatch() {
  const store = getStoreWithContext()
  return store.getStore().dispatch as (
    action: Partial<{ payload: any; type: any }>
  ) => void
}

export function useSelector(sliceName?: string | ((state: any) => any)) {
  const store = getStoreWithContext()
  const state = store.getState()
  if (isFunction(sliceName)) {
    return sliceName(state)
  }
  return sliceName ? state[sliceName] : state
}

export function useStore() {
  const store = getStoreWithContext()
  return store
}

const dox: Middleware = function dox({}) {
  return function (next) {
    return function (action) {
      const value = next(action)
      return value
    }
  }
}

export function createStore<
  S extends object,
  A extends Action = AnyAction,
  M extends Middlewares<S> = [ThunkMiddlewareFor<S>]
>(options: ConfigureStoreOptions<S, A, M>) {
  const defaultOptions: ConfigureStoreOptions<S, A, M> = extend({}, options, {
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(dox),
  })
  const store = configureStore(defaultOptions)
  const state = useReactive(clone(store.getState() || {}), true)

  store.subscribe(() => {
    pauseTrack()
    readwrite(state)
    sync(state, store.getState())
    readonly(state)
    enableTrack()
  })

  function getStore() {
    return store
  }
  function getState() {
    return state
  }

  return createPlugin({
    name: 'dox',
    extra: store,
    data: { store, state, getStore, getState },
  })
}

export const Provider = FC<ProviderProps>(function Provider(props) {
  const plugins = usePlugin()
  plugins.set(TypeStore, props.store.data)

  return function Provider({ children }) {
    return children
  }
})
