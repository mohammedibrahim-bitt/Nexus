import type { BasePayload } from 'payload'

import { runDueSeoResearchRules } from './runDueRules'

const CHECK_INTERVAL_MS = 60 * 60 * 1000 // hourly — plenty of resolution for day-granularity rules
const STARTUP_DELAY_MS = 30 * 1000

declare global {
  // eslint-disable-next-line no-var
  var __seoResearchSchedulerStarted: boolean | undefined
}

// Makes scheduled SEO research rules actually run on their own — no external
// cron needs to be wired up. This ticks inside the same long-lived Node
// process the app already runs as (Docker), the same assumption the manual
// trigger route already makes for its in-process fire-and-forget call.
//
// Guarded by a global flag because Next dev's hot-reload can re-invoke
// Payload's onInit within the same process; without the guard each reload
// would stack another interval on top of the last.
export function startSeoResearchScheduler(payload: BasePayload): void {
  if (globalThis.__seoResearchSchedulerStarted) return
  globalThis.__seoResearchSchedulerStarted = true

  const tick = () => {
    runDueSeoResearchRules(payload).catch((err) => {
      payload.logger.error(`[seoResearch] scheduler tick failed: ${err}`)
    })
  }

  setTimeout(tick, STARTUP_DELAY_MS)
  setInterval(tick, CHECK_INTERVAL_MS)

  payload.logger.info('[seoResearch] automatic scheduler started (checks hourly for due rules)')
}
