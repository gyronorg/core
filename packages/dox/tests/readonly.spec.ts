import { createStore, createReducer, useDispatch, useSelector } from '../src'
import { appEnv } from './utils'

describe('Readonly', () => {
  test('object readonly', () => {
    const store = createStore({
      reducer: createReducer(
        {
          count: 0,
        },
        {
          increment(state) {
            state.count++
          },
        }
      ),
    })
    appEnv(store, () => {
      const state = useSelector()
      const f = jest.fn((x) => {
        expect(state.count).toBe(x)
      })
      try {
        state.count = 1
      } catch (_) {
        f(0)
      }
      expect(f).toHaveBeenCalledTimes(1)
      const dispatch = useDispatch()
      dispatch({ type: 'increment' })
      expect(state.count).toBe(1)
    })
  })

  test('deep object readonly', () => {
    const store = createStore({
      reducer: createReducer(
        {
          p: {
            c: 0,
          },
        },
        {
          add(state) {
            state.p.c = 0
          },
        }
      ),
    })
    appEnv(store, () => {
      const state = useSelector()
      const f = jest.fn(() => {
        expect(state.p.c).toBe(0)
      })
      try {
        state.p.c = 1
      } catch (_) {
        f()
      }
      expect(f).toHaveBeenCalledTimes(1)
    })
  })
})
