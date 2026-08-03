import type { BasePayload } from 'payload'

import type { AiProvider } from './aiClient'

import { resolveKeywordTemplate } from './resolveKeywordTemplate'
import { runSeoResearch } from './runSeoResearch'

// Safety net against a misconfigured rule (or a bug) silently burning
// through a staff member's SerpApi/AI quota — caps how many automatic runs
// can start per calendar day across ALL rules combined. Not user-configurable
// on purpose: it's a backstop, not a feature knob. Raise it here if you
// genuinely need more automatic runs per day.
const MAX_AUTOMATIC_RUNS_PER_DAY = 10

const isDue = (lastRunAt: null | string | undefined, intervalDays: number): boolean => {
  if (!lastRunAt) return true
  const dueAt = new Date(lastRunAt).getTime() + intervalDays * 24 * 60 * 60 * 1000
  return Date.now() >= dueAt
}

export type RunDueRulesResult = {
  errored: string[]
  ran: string[]
  skipped: string[]
}

async function countRunsToday(payload: BasePayload): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { totalDocs } = await payload.count({
    collection: 'seo-research-runs',
    where: { createdAt: { greater_than_equal: startOfDay.toISOString() } },
  })

  return totalDocs
}

// Checks every active seo-research-rule and, for any that are due, runs the
// exact same pipeline the manual "trigger a run" button uses — same
// hardcoded `_status: 'draft'` on the resulting post, same review flow.
// Runs sequentially (not in parallel) so overlapping calls (e.g. the
// in-process scheduler firing while a slow run from the previous tick is
// still going) can't double-run the same rule.
export async function runDueSeoResearchRules(payload: BasePayload): Promise<RunDueRulesResult> {
  const result: RunDueRulesResult = { errored: [], ran: [], skipped: [] }

  const { docs: rules } = await payload.find({
    collection: 'seo-research-rules',
    limit: 100,
    where: { active: { equals: true } },
  })

  let runsToday = await countRunsToday(payload)

  for (const rule of rules) {
    if (!isDue(rule.lastRunAt, rule.intervalDays)) {
      continue
    }

    if (runsToday >= MAX_AUTOMATIC_RUNS_PER_DAY) {
      payload.logger.warn(
        `[seoResearch] daily automatic-run cap (${MAX_AUTOMATIC_RUNS_PER_DAY}) reached — "${rule.keyword}" and any remaining due rules will be picked up on a later check.`,
      )
      result.skipped.push(rule.keyword)
      continue
    }

    const runAsUserId = typeof rule.runAsUser === 'object' ? rule.runAsUser?.id : rule.runAsUser
    if (!runAsUserId) {
      result.skipped.push(rule.keyword)
      continue
    }

    // Local-API read bypasses field access control, so the encrypted key
    // fields' `afterRead` hooks still decrypt them for us here even though
    // there's no logged-in "self" making this request.
    const runAsUser = await payload.findByID({ id: runAsUserId, collection: 'users' })
    const { aiApiKey, aiProvider, serpApiKey } = runAsUser

    if (!serpApiKey || !aiApiKey || !aiProvider) {
      await payload.update({
        id: rule.id,
        collection: 'seo-research-rules',
        context: { disableRevalidate: true },
        data: {
          lastRunAt: new Date().toISOString(),
          lastRunStatus: `Skipped: ${runAsUser.name || runAsUser.email} is missing a SerpApi key, AI provider, or AI API key on their profile.`,
        },
      })
      result.skipped.push(rule.keyword)
      continue
    }

    let resolvedKeyword: string
    try {
      resolvedKeyword = await resolveKeywordTemplate(
        rule.keyword,
        aiApiKey,
        aiProvider as AiProvider,
      )
    } catch (err) {
      payload.logger.error(`[seoResearch] template resolution for "${rule.keyword}" threw: ${err}`)
      await payload.update({
        id: rule.id,
        collection: 'seo-research-rules',
        context: { disableRevalidate: true },
        data: {
          lastRunAt: new Date().toISOString(),
          lastRunStatus: `Failed to resolve keyword template: ${err instanceof Error ? err.message : 'unknown error'}`,
        },
      })
      result.errored.push(rule.keyword)
      continue
    }

    const run = await payload.create({
      collection: 'seo-research-runs',
      context: { disableRevalidate: true },
      data: {
        keyword: resolvedKeyword,
        status: 'queued',
        triggeredBy: runAsUserId,
        triggeredByRule: rule.id,
      },
    })
    runsToday += 1

    try {
      await runSeoResearch(payload, run.id, {
        aiApiKey,
        aiProvider: aiProvider as AiProvider,
        authorId: Number(runAsUserId),
        serpApiKey,
      })

      const finished = await payload.findByID({ id: run.id, collection: 'seo-research-runs' })

      await payload.update({
        id: rule.id,
        collection: 'seo-research-rules',
        context: { disableRevalidate: true },
        data: {
          lastRun: run.id,
          lastRunAt: new Date().toISOString(),
          lastRunStatus:
            finished.status === 'completed'
              ? `Completed — draft created for "${resolvedKeyword}", awaiting review.`
              : `Failed ("${resolvedKeyword}"): ${finished.error || 'unknown error'}`,
        },
      })

      if (finished.status === 'completed') {
        result.ran.push(resolvedKeyword)
      } else {
        result.errored.push(resolvedKeyword)
      }
    } catch (err) {
      payload.logger.error(`[seoResearch] scheduled run for "${resolvedKeyword}" threw: ${err}`)
      await payload.update({
        id: rule.id,
        collection: 'seo-research-rules',
        context: { disableRevalidate: true },
        data: {
          lastRun: run.id,
          lastRunAt: new Date().toISOString(),
          lastRunStatus: `Failed ("${resolvedKeyword}"): ${err instanceof Error ? err.message : 'unknown error'}`,
        },
      })
      result.errored.push(resolvedKeyword)
    }
  }

  return result
}
