import { lazy, memo, Suspense, useCallback, useMemo, useState } from 'react'
import { useLiveStream } from '../../hooks/useLiveStream'
import { ErrorState } from '../../shared/errors/ErrorState'
import { Option, Select } from '../../shared/ui'
import { ActiveAlerts } from './components/ActiveAlerts'
import { ConnectionBar } from './components/ConnectionBar'
import { EventsList } from './components/EventsList'
import { KpiCards } from './components/KpiCards'

const LiveChart = lazy(() => import('./components/LiveChart').then((module) => ({ default: module.LiveChart })))

const healthStatuses = [
  { key: 'healthy', label: 'Healthy' },
  { key: 'warning', label: 'Warning' },
  { key: 'critical', label: 'Critical' },
] as const

interface DashboardToolbarProps {
  windowMinutes: number
  metric: string
  metrics: string[]
  onWindowChange: (value: string) => void
  onMetricChange: (value: string) => void
}

function DashboardToolbarView({ windowMinutes, metric, metrics, onWindowChange, onMetricChange }: DashboardToolbarProps) {
  return (
    <div className="page-heading">
      <div><p className="eyebrow">LIVE OPERATIONS</p><h1>Monitoring overview</h1><p>Track incoming service health and activity.</p></div>
      <div className="dashboard-filters" aria-label="Dashboard filters">
        <Select id="time-window" label="Time window" value={String(windowMinutes)} onChange={onWindowChange}>
          <Option value="1">Last minute</Option>
          <Option value="5">Last 5 minutes</Option>
          <Option value="15">Last 15 minutes</Option>
        </Select>
        <Select id="chart-metric" label="Chart metric" value={metric} onChange={onMetricChange} disabled={metrics.length === 0}>
          {metrics.length === 0 && <Option value="">Waiting for data</Option>}
          {metrics.map((item) => <Option value={item} key={item}>{item.replaceAll('_', ' ')}</Option>)}
        </Select>
      </div>
    </div>
  )
}

const DashboardToolbar = memo(DashboardToolbarView, (previous, next) =>
  previous.windowMinutes === next.windowMinutes &&
  previous.metric === next.metric &&
  previous.onWindowChange === next.onWindowChange &&
  previous.onMetricChange === next.onMetricChange &&
  previous.metrics.length === next.metrics.length &&
  previous.metrics.every((metric, index) => metric === next.metrics[index]),
)

export function DashboardLiveView() {
  const { events, status, togglePause, retry, totalReceived, recentRate, statusCountsByWindow, currentTime } = useLiveStream({ bufferSize: 200 })
  const [windowMinutes, setWindowMinutes] = useState<1 | 5 | 15>(15)
  const [selectedMetric, setSelectedMetric] = useState('')
  const metrics = useMemo(() => [...new Set(events.map((event) => event.metric))].sort(), [events])
  const activeMetric = metrics.includes(selectedMetric) ? selectedMetric : metrics[0] ?? ''
  const onWindowChange = useCallback((value: string) => setWindowMinutes(Number(value) as 1 | 5 | 15), [])
  const onMetricChange = useCallback((value: string) => setSelectedMetric(value), [])

  const visibleEvents = useMemo(() => {
    const cutoff = currentTime - windowMinutes * 60_000
    return events.filter((event) => event.timestamp >= cutoff)
  }, [events, windowMinutes, currentTime])
  const statusCounts = statusCountsByWindow[windowMinutes]
  const healthEventCount = statusCounts.healthy + statusCounts.warning + statusCounts.critical
  const kpiValues = useMemo(() => ({
    totalEvents: totalReceived,
    eventsPerMinute: recentRate,
    warningEvents: statusCounts.warning,
    criticalEvents: statusCounts.critical,
  }), [totalReceived, recentRate, statusCounts])
  const healthyPercent = healthEventCount ? Math.round((statusCounts.healthy / healthEventCount) * 100) : 0

  return (
    <>
      <DashboardToolbar
        windowMinutes={windowMinutes}
        metric={activeMetric}
        metrics={metrics}
        onWindowChange={onWindowChange}
        onMetricChange={onMetricChange}
      />
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
            <p>{healthEventCount.toLocaleString()} events<br /><span>in selected window</span></p>
          </div>
          <div className="health-status-list">
            {healthStatuses.map(({ key, label }) => {
              const count = statusCounts[key]
              const percentage = healthEventCount ? Math.round((count / healthEventCount) * 100) : 0
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
    </>
  )
}
