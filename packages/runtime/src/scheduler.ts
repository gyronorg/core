import type { Noop } from '@gyron/shared'
import type { Component } from './component'
import { callWithErrorHandling, ErrorHandlingType } from './renderComponent'

export interface SchedulerJob {
  (): void
  id: number
  component: Component
  priority: JobPriority
}

const queue: SchedulerJob[] = []
const resolvedPromise: Promise<unknown> = Promise.resolve()
const frameYield = 5
let currentJobPromise: Promise<unknown>
let startTime = -1

/**
 * TODO Update tasks need to be prioritised, with those of higher priority being executed first, followed by those of lower priority.
 */
export enum JobPriority {
  NORMAL_TIMEOUT = 0,
  USER_TIMEOUT = 1,
}

export function nextRender(fn?: Noop) {
  const p = currentJobPromise || resolvedPromise
  return fn ? p.then(fn) : p
}

export function pushQueueJob(job: SchedulerJob) {
  if (job.id === null) {
    queue.push(job)
  } else {
    // same component update using the latest data update
    // array.prototype.splice will trigger update multiple times, the first time the data is incorrect, see Proxy splice set
    let index = queue.length - 1
    let shouldInsert = false
    while (index >= 0) {
      if (queue[index].id === job.id) {
        shouldInsert = true
        break
      }
      index--
    }
    if (shouldInsert) {
      // prioritise the same component update to completion.
      // when multiple updates of the same component are found in a synchronous task,
      // insert its next task at the end of an update task of the same type.
      // jobId = 3; queue = [1, 3, 5]
      // queue = [1, 3, 3, 5]
      queue.splice(index, 0, job)
    } else {
      queue.push(job)
    }
  }

  currentJobPromise = resolvedPromise.then(flushJobs)
}

export function flushJobs() {
  try {
    startTime = now()
    // optimise the behaviour of multiple components when synchronised updates block the host process,
    // returning execution to the host when the threshold is exceeded and continuing the
    // component update task when the host environment is free
    workLoop()
  } catch {
    queue.length = 0
  }
}

export const now = () =>
  typeof performance === 'object' ? performance.now() : Date.now()

const localNavigator = navigator as Navigator & {
  scheduling: { isInputPending: () => boolean }
}

// https://web.dev/isinputpending/
const isInputPending: () => boolean =
  typeof navigator !== 'undefined' &&
  localNavigator.scheduling !== undefined &&
  localNavigator.scheduling.isInputPending !== undefined
    ? localNavigator.scheduling.isInputPending.bind(localNavigator.scheduling)
    : null

const timeout = (callback: () => void, ms: number) => {
  if (global.requestIdleCallback) {
    requestIdleCallback(callback, { timeout: ms })
  } else {
    setTimeout(callback, ms)
  }
}

export function cancelTimeout(callback: number) {
  if (global.requestIdleCallback) {
    cancelIdleCallback(callback)
  } else {
    clearTimeout(callback)
  }
}

function shouldYieldHost() {
  if (now() - startTime < frameYield) {
    return false
  }
  if (isInputPending !== null) {
    return isInputPending()
  }
  return true
}

function workLoop(pendingJobs?: SchedulerJob[]) {
  queue.sort((a, b) => a.id - b.id)
  const jobs = pendingJobs || queue

  // TODO use pop method
  let currentJob = jobs.shift()
  while (currentJob) {
    callWithErrorHandling(
      currentJob,
      currentJob.component,
      ErrorHandlingType.Scheduler
    )
    if (shouldYieldHost()) {
      // if there are still unUpdated tasks, put the unUpdated tasks to continue when the browser is free
      if (queue.length) {
        currentJobPromise = new Promise<void>((resolve) => {
          startTime = now()
          // identify suitable opportunities to perform outstanding updates again
          const pendingJobs = [...queue]
          timeout(() => {
            workLoop(pendingJobs)
            resolve()
          }, 1000 / 24)
        })
      }
      break
    }
    currentJob = jobs.shift()
  }
}
