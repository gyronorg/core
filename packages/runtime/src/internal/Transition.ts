import { RenderElement, VNode } from '../vnode'
import { FC } from '../component'
import { isFunction, isNumber, shouldValue } from '@gyron/shared'
import { Noop } from '@gyron/shared'
import { InnerCode, assertWarn } from '../assert'
import { isVNode, isVNodeComment } from '../shared'

interface TransitionPropsNormalize {
  cls: {
    activeBefore: string
    active: string
    leaveBefore: string
    leave: string
  }
  duration: { active: number; leave: number }
}

export interface TransitionHooks {
  state: ReturnType<typeof useTransitionState>
  onActive: (el: Element) => void
  onLeave: (el: Element, done: Noop) => void
  onLeaveFinish: (el: Element) => void
  // TODO for transition group
  delayLeave?: (el: Element, done?: Noop) => void
}

type Duration = number | { active: number; leave: number }

type TransitionState = ReturnType<typeof useTransitionState>

type TransitionElementMethod = '__remove__' | '__active__'

export interface TransitionProps {
  name: string
  activeBeforeClassName?: string
  activeClassName?: string
  leaveBeforeClassName?: string
  leaveClassName?: string
  duration?: Duration
}

function normalizedClassName(props: TransitionProps) {
  return {
    activeBefore: props.activeBeforeClassName || `${props.name}-active-before`,
    active: props.activeClassName || `${props.name}-active`,
    leaveBefore: props.leaveBeforeClassName || `${props.name}-leave-before`,
    leave: props.leaveClassName || `${props.name}-leave`,
  }
}

let _uid = 0
export function whenTransitionEnd(
  el: Element & { __uid__?: number },
  duration: number | null,
  done: Noop,
  debugOptions?: {
    transition: string
  }
) {
  const id = (el.__uid__ = ++_uid)

  function onEnd() {
    el.removeEventListener('transitionend', onEnd)
    if (el.__uid__ === id) {
      // no less than 1 animation execution of the element occurs, and no callbacks are executed before
      done()
    }
  }

  if (isNumber(duration)) {
    return setTimeout(onEnd, duration)
  }

  // check is element has transition
  const transition = debugOptions
    ? debugOptions.transition
    : window.getComputedStyle(el).getPropertyValue('transition')
  const hasTransition = transition !== 'all 0s ease 0s'

  if (hasTransition) {
    el.addEventListener('transitionend', onEnd)
  } else {
    onEnd()
  }
}
function onAddClassName(el: Element, name: string) {
  el.classList.add(name)
}
function onRemoveClassName(el: Element, name: string) {
  el.classList.remove(name)
}
function onBeforeActiveHook(el: Element, props: TransitionPropsNormalize) {
  onAddClassName(el, props.cls.activeBefore)
}
function onActiveHook(
  el: Element,
  props: TransitionPropsNormalize,
  done: Noop
) {
  return requestAnimationFrame(() => {
    onRemoveClassName(el, props.cls.activeBefore)
    onAddClassName(el, props.cls.active)
    whenTransitionEnd(el, props.duration?.active, done)
  })
}
function onBeforeLeaveHook(el: Element, props: TransitionPropsNormalize) {
  onAddClassName(el, props.cls.leaveBefore)
}
function onLeaveHook(el: Element, props: TransitionPropsNormalize, done: Noop) {
  return requestAnimationFrame(() => {
    onRemoveClassName(el, props.cls.leaveBefore)
    onAddClassName(el, props.cls.leave)
    whenTransitionEnd(el, props.duration?.leave, done)
  })
}
function onActiveFinish(el: Element, props: TransitionPropsNormalize) {
  onRemoveClassName(el, props.cls.activeBefore)
  onRemoveClassName(el, props.cls.active)
}
function onLeaveFinish(el: Element, props: TransitionPropsNormalize) {
  onRemoveClassName(el, props.cls.leaveBefore)
  onRemoveClassName(el, props.cls.leave)
}

function normalizeTransitionProps(
  props: TransitionProps
): TransitionPropsNormalize {
  function normalizeDuration(duration: Duration) {
    if (isNumber(duration)) {
      return {
        active: duration,
        leave: duration,
      }
    }
    return duration
  }
  return {
    cls: normalizedClassName(props),
    duration: normalizeDuration(props.duration),
  }
}

function useTransitionState() {
  const leaveInnerNodes = new Map<
    any,
    Record<number | string | symbol, VNode>
  >()
  const activeInnerNodes = new Map<
    any,
    Record<number | string | symbol, VNode>
  >()
  return {
    leaveInnerNodes,
    activeInnerNodes,
  }
}

function processFinish(
  state: TransitionState,
  vnode: VNode,
  type: keyof TransitionState,
  method: TransitionElementMethod
) {
  const n = state[type].get(vnode.type)
  const n1 = n && n[vnode.key]
  if (n1 && n1.el && n1.el[method]) {
    const f = n1.el[method]
    n1.el[method] = undefined
    isFunction(f) && f()
    delete n[vnode.key]
  }
}

function setInnerVNode(
  state: TransitionState,
  vnode: VNode,
  type: keyof TransitionState
) {
  const cache = state[type]
  if (shouldValue(vnode.key)) {
    if (cache.has(vnode.type)) {
      const n = cache.get(vnode.type)
      n[vnode.key] = vnode
    } else {
      cache.set(vnode.type, {
        [vnode.key]: vnode,
      })
    }
  } else if (__DEV__) {
    assertWarn(
      `An exception has occurred, please submit error code ${InnerCode.Transition} to issue`,
      vnode.component,
      'Transition'
    )
  }
}

function generateTransitionHook(
  vnode: VNode,
  state: ReturnType<typeof useTransitionState>,
  props: TransitionPropsNormalize
): TransitionHooks {
  return {
    state: state,
    onActive(el) {
      processFinish(state, vnode, 'leaveInnerNodes', '__remove__')
      setInnerVNode(state, vnode, 'activeInnerNodes')

      const done = ((el as RenderElement).__active__ = () => {
        onActiveFinish(el, props)
      })

      onBeforeActiveHook(el, props)
      onActiveHook(el, props, done)
    },
    onLeave(el, remove) {
      processFinish(state, vnode, 'activeInnerNodes', '__active__')
      setInnerVNode(state, vnode, 'leaveInnerNodes')

      const done = ((el as RenderElement).__remove__ = () => {
        onLeaveFinish(el, props)
        remove()
      })

      onBeforeLeaveHook(el, props)
      onLeaveHook(el, props, done)
    },
    onLeaveFinish(el) {
      onLeaveFinish(el, props)
    },
  }
}

function setTransition(vnode: VNode, hooks: TransitionHooks) {
  vnode.transition = hooks
}

export const Transition = FC<TransitionProps>(function Transition() {
  const state = useTransitionState()
  return function TransitionChildren(props, component) {
    const n1 = component.subTree
    const n2 = props.children

    const normalizeProps = normalizeTransitionProps(props)
    if (isVNode(n2) && !isVNodeComment(n2)) {
      setTransition(n2, generateTransitionHook(n2, state, normalizeProps))
    }

    if (isVNode(n1) && !isVNodeComment(n1)) {
      setTransition(n1, generateTransitionHook(n1, state, normalizeProps))
    }

    return n2
  }
})
