import { memo, useMemo } from 'react'
import type { MonitoringEvent } from '../../../types/event'

interface ActiveAlertsProps { events: MonitoringEvent[] }

export const ActiveAlerts = memo(function ActiveAlerts({ events }: ActiveAlertsProps) {
  const alerts = useMemo(() => events.filter((event) => event.status !== 'healthy').slice(0, 4), [events])

  return (
    <section className="panel alerts-panel" aria-labelledby="alerts-title">
      <div className="panel-heading">
        <div><h2 id="alerts-title">Active alerts</h2><p>Recent warnings and critical events</p></div>
        <span className="alert-count">{alerts.length} active</span>
      </div>
      {alerts.length ? (
        <ul className="alert-list">
          {alerts.map((event) => (
            <li className={`alert-item alert-item--${event.status}`} key={event.id}>
              <span className="alert-indicator" aria-hidden="true" />
              <div className="alert-copy"><strong>{event.source} · {event.metric.replaceAll('_', ' ')}</strong><span>{event.status} · {event.value.toFixed(1)}</span></div>
              <time>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
            </li>
          ))}
        </ul>
      ) : <p className="alerts-empty">No active alerts in this time window.</p>}
    </section>
  )
})
