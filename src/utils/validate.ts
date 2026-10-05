import type { EventStatus, MonitoringEvent } from '../types/event'

const EVENT_STATUSES: EventStatus[] = ['healthy', 'warning', 'critical']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length > 0 && text.length <= maxLength ? text : null
}

/** Converts an untrusted stream payload into the small shape the UI accepts. */
export function parseMonitoringEvent(value: unknown): MonitoringEvent | null {
  if (!isRecord(value)) return null

  const id = safeText(value.id, 80)
  const source = safeText(value.source, 60)
  const metric = safeText(value.metric, 60)
  const timestamp = value.timestamp
  const metricValue = value.value

  if (
    !id || !source || !metric ||
    typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp <= 0 ||
    typeof metricValue !== 'number' || !Number.isFinite(metricValue) ||
    metricValue < -1_000_000 || metricValue > 1_000_000 ||
    typeof value.status !== 'string' || !EVENT_STATUSES.includes(value.status as EventStatus)
  ) {
    return null
  }

  return {
    id,
    timestamp,
    source,
    metric,
    value: metricValue,
    status: value.status as EventStatus,
  }
}
