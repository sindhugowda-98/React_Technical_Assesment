import { lazy, Suspense, useMemo, useState } from 'react'
import { AppLayout } from '../../shared/layout/AppLayout'
import { useLiveStream } from '../../hooks/useLiveStream'
import { ConnectionBar } from './components/ConnectionBar'
import { EventsList } from './components/EventsList'
import { KpiCards } from './components/KpiCards'
import { ActiveAlerts } from './components/ActiveAlerts'
import { Option, Select } from '../../shared/ui'
import { ErrorState } from '../../shared/errors/ErrorState'

const LiveChart = lazy(() =>
  import('./components/LiveChart').then((module) => ({ default: module.LiveChart })),
)

const healthStatuses = [
  { key: 'healthy', label: 'Healthy' },
  { key: 'warning', label: 'Warning' },
  { key: 'critical', label: 'Critical' },
] as const

export function DashboardPage() {
  const { events, status, togglePause, retry, totalReceived, recentRate } = useLiveStream({ bufferSize: 200 })
  const [windowMinutes, setWindowMinutes] = useState(15)
  const [selectedMetric, setSelectedMetric] = useState('')
  const metrics = useMemo(() => [...new Set(events.map((event) => event.metric))].sort(), [events])
  const activeMetric = metrics.includes(selectedMetric) ? selectedMetric : metrics[0] ?? ''
  const visibleEvents = useMemo(() => {
    const cutoff = Date.now() - windowMinutes * 60_000
    return events.filter((event) => event.timestamp >= cutoff)
  }, [events, windowMinutes])
  const statusCounts = useMemo(() => visibleEvents.reduce((counts, event) => {
    counts[event.status] += 1
    return counts
  }, { healthy: 0, warning: 0, critical: 0 }), [visibleEvents])
  const kpiValues = useMemo(() => ({
    totalEvents: totalReceived,
    eventsPerMinute: recentRate,
    warningEvents: statusCounts.warning,
    criticalEvents: statusCounts.critical,
  }), [totalReceived, recentRate, statusCounts])

  const healthyPercent = visibleEvents.length ? Math.round((statusCounts.healthy / visibleEvents.length) * 100) : 0

  return (
    <AppLayout>
      <div className="page-heading">
        <div><p className="eyebrow">LIVE OPERATIONS</p><h1>Monitoring overview</h1><p>Track incoming service health and activity.</p></div>
        <div className="dashboard-filters" aria-label="Dashboard filters">
          <Select id="time-window" label="Time window" value={String(windowMinutes)} onChange={(value) => setWindowMinutes(Number(value))}>
            <Option value="1">Last minute</Option>
            <Option value="5">Last 5 minutes</Option>
            <Option value="15">Last 15 minutes</Option>
          </Select>
          <Select id="chart-metric" label="Chart metric" value={activeMetric} onChange={setSelectedMetric} disabled={metrics.length === 0}>
            {metrics.length === 0 && <Option value="">Waiting for data</Option>}
            {metrics.map((metric) => <Option value={metric} key={metric}>{metric.replaceAll('_', ' ')}</Option>)}
          </Select>
        </div>
      </div>
      <ConnectionBar status={status} onTogglePause={togglePause} />
      {status === 'error' && <ErrorState title="Live feed connection error" message="The live feed could not connect. We’ll retry automatically; you can also retry now." onRetry={retry} />}
      <KpiCards values={kpiValues} />
      <div className="dashboard-primary-grid">
        <Suspense fallback={<section className="panel chart-placeholder" aria-label="Loading chart">Loading chart…</section>}>
          <LiveChart events={visibleEvents} metric={activeMetric} />
        </Suspense>
        <section className="panel health-panel" aria-labelledby="health-title">
          <div className="panel-heading">
            <div><h2 id="health-title">Service health</h2><p>Status across the selected window</p></div>
          </div>
          <div className="health-score">
            <div className="health-ring" style={{ background: `conic-gradient(#14a89b 0 ${healthyPercent}%, #e8eff1 ${healthyPercent}% 100%)` }}>
              <div><strong>{healthyPercent}%</strong><span>healthy</span></div>
            </div>
            <p>{visibleEvents.length.toLocaleString()} events<br /><span>in selected window</span></p>
          </div>
          <div className="health-status-list">
            {healthStatuses.map(({ key, label }) => {
              const count = statusCounts[key]
              const percentage = visibleEvents.length ? Math.round((count / visibleEvents.length) * 100) : 0
              return (
                <div className={`health-status health-status--${key}`} key={key}>
                  <div className="health-status-heading"><span><i />{label}</span><strong>{count}</strong></div>
                  <div className="health-track"><span style={{ width: `${percentage}%` }} /></div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
      <div className="dashboard-secondary-grid">
        <EventsList events={visibleEvents} />
        <ActiveAlerts events={visibleEvents} />
      </div>
    </AppLayout>
  )
}
