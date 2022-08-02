export function useReducer<R extends React.ReducerWithoutAction<any>, I>(
  reducer: R,
  initializerArg: I,
  initializer: (arg: I) => React.ReducerStateWithoutAction<R>
): [React.ReducerStateWithoutAction<R>, React.DispatchWithoutAction] {
  // TODO
  return [
    reducer(initializerArg),
    () => {
      // TODO
    },
  ]
}

export function useCallback<T extends () => void>(
  callback: T,
  deps: React.DependencyList
): T {
  // TODO
  return callback
}

export function useMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  // TODO
  return factory()
}
