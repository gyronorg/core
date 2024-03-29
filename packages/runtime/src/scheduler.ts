import type { Noop } from '@gyron/shared'
import type { Component } from './component'
import { ErrorHandlingType, callWithErrorHandling } from './component'

export interface SchedulerJob {
  (): void
  id: number
  component: Component
  priority: JobPriority
}

const queue: SchedulerJob[] = []
const resolvedPromise: Promise<unknown> = Promise.resolve()
const frameYield = 5
const delaysTime = 1000 / 60
const pendingJobPromise: Promise<unknown>[] = []
let currentJobPromise: Promise<unknown>
let startTime = -1

/**
 * Update tasks need to be prioritized, with those of higher priority being executed first, followed by those of lower priority.
 */
export enum JobPriority {
  DEFERRED = -1,
  NORMAL = 0,
}

/**
 * Wait for the data to finish rendering and the updated DOM node will be available in the next tick.
 * ```js
 * import { h, useValue, nextRender, createRef, onAfterMount } from 'gyron'
 *
 * const App = h(() => {
 *   const count = useValue(0)
 *   const ref = createRef()
 *
 *   onAfterMount(() => {
 *     count.value++
 *     nextRender().then(() => {
 *       console.log(ref.current.innerText) // 1
 *     })
 *     console.log(ref.current.innerText) // 0
 *   })
 *   return h('div', { ref }, count.value)
 * })
 *```
 * @param fn The next scale call function.
 * @returns Returns a Promise that changes the state of a task only after all tasks have completed, regardless of how long the task has been executed.
 */
export function nextRender(fn?: Noop) {
  const p = Promise.all(pendingJobPromise || [resolvedPromise]).finally(() => {
    pendingJobPromise.length = 0
  })
  return fn ? p.then(fn) : p
}

export function pushQueueJob(job: SchedulerJob) {
  if (job.id === null) {
    queue.push(job)
  } else {
    // same component update using the latest data update
    // array.prototype.splice will trigger update multiple times, the first time the data is incorrect, see Proxy splice set
    const index = queue.findIndex((item) => item.id === job.id)
    if (index >= 0) {
      // priorities the same component update to completion.
      // when multiple updates of the same component are found in a synchronous task,
      // insert its next task at the end of an update task of the same type.
      // jobId = 3; O = old job id; N = new job id queue = [1, O3, 5]
      // queue = [1, N3, 5]
      queue.splice(index, 1, job)
    } else {
      queue.push(job)
    }
  }

  currentJobPromise = resolvedPromise.then(flushJobs)
  pendingJobPromise.push(currentJobPromise)
}

export function flushJobs() {
  try {
    startTime = now()
    // opt the behavior of multiple components when synchronized updates block the host process,
    // returning execution to the host when the threshold is exceeded and continuing the
    // component update task when the host environment is free
    return workLoop()
  } catch {
    queue.length = 0
  }
}

export const now = () => {
  return typeof performance === 'object' ? performance.now() : Date.now()
}

const self = typeof global === 'object' ? global : window

const navigator = self.navigator as Navigator & {
  scheduling: { isInputPending: () => boolean }
}

// https://web.dev/isinputpending/
const isInputPending: () => boolean =
  typeof navigator !== 'undefined' &&
  navigator.scheduling !== undefined &&
  navigator.scheduling.isInputPending !== undefined
    ? navigator.scheduling.isInputPending.bind(navigator.scheduling)
    : null

const timeout = (callback: Noop, ms: number) => {
  if (self.requestIdleCallback) {
    requestIdleCallback(callback, { timeout: ms })
  } else {
    setTimeout(callback, ms)
  }
}

export function cancelTimeout(callback: number) {
  if (self.requestIdleCallback) {
    cancelIdleCallback(callback)
  } else {
    clearTimeout(callback)
  }
}

function shouldYieldHost() {
  if (now() - startTime > frameYield) {
    return true
  }
  if (isInputPending !== null) {
    return isInputPending()
  }
  return true
}

function workLoop(pendingJobs?: SchedulerJob[]) {
  return new Promise<void>((resolve) => {
    // guaranteed top-down update order
    queue.sort((a, b) => a.id - b.id)
    const jobs = pendingJobs || queue

    let currentJob = jobs.shift()
    let idleJob: Promise<void>
    while (currentJob) {
      callWithErrorHandling(
        currentJob,
        currentJob.component,
        ErrorHandlingType.Scheduler
      )
      if (shouldYieldHost() && jobs.length > 0) {
        // if there are still unUpdated tasks, put the unUpdated tasks to continue when the browser is free
        idleJob = new Promise<void>((resolve) => {
          startTime = now()
          // identify suitable opportunities to perform outstanding updates again
          const pendingJobs = [...jobs]
          timeout(() => {
            workLoop(pendingJobs).then(resolve)
          }, delaysTime)
          jobs.length = 0
        })
        break
      }
      currentJob = jobs.shift()
    }
    if (idleJob) {
      idleJob.then(resolve)
    } else {
      resolve()
    }
  })
}
