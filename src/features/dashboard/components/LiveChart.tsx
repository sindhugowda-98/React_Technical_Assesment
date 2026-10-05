import { memo, useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonitoringEvent } from '../../../types/event'

interface LiveChartProps {
  events: MonitoringEvent[]
  metric: string
}

export const LiveChart = memo(function LiveChart({ events, metric }: LiveChartProps) {
  const chartEvents = useMemo(
    () => events.filter((event) => event.metric === metric).slice().reverse(),
    [events, metric],
  )

  return (
    <section className="panel" aria-labelledby="chart-title">
      <div className="panel-heading">
        <div><h2 id="chart-title">Incoming metric</h2><p>{metric ? metric.replaceAll('_', ' ') : 'Recent stream values'}</p></div>
      </div>
      {chartEvents.length > 0 ? (
        <div className="live-chart" role="img" aria-label={`Live time series for ${metric}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartEvents} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#e8eff0" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp: number) => new Date(timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                tick={{ fill: '#8794a6', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={32}
              />
              <YAxis tick={{ fill: '#8794a6', fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
              <Tooltip
                labelFormatter={(timestamp) => new Date(Number(timestamp)).toLocaleTimeString()}
                contentStyle={{ border: '1px solid #e6ebf2', borderRadius: 10, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={metric.replaceAll('_', ' ')}
                stroke="#10979d"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-placeholder" aria-live="polite">
          <span>{events.length ? 'No points for this metric in the selected time window' : 'Waiting for incoming data'}</span>
        </div>
      )}
    </section>
  )
})
