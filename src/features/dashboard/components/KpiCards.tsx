import { memo } from 'react'

export interface DashboardKpis {
  totalEvents: number;
  eventsPerMinute: number;
  warningEvents: number;
  criticalEvents: number;
}

interface KpiCardsProps {
  values: DashboardKpis;
}

const labels: {
  key: keyof DashboardKpis;
  label: string;
  detail: string;
  icon: string;
}[] = [
  {
    key: "totalEvents",
    label: "Events received",
    detail: "This session",
    icon: "EV",
  },
  {
    key: "eventsPerMinute",
    label: "Events per minute",
    detail: "Rolling 60 seconds",
    icon: "↗",
  },
  {
    key: "warningEvents",
    label: "Warnings",
    detail: "Selected time window",
    icon: "!",
  },
  {
    key: "criticalEvents",
    label: "Critical events",
    detail: "Selected time window",
    icon: "!",
  },
];

export const KpiCards = memo(function KpiCards({ values }: KpiCardsProps) {
  return (
    <section className="kpi-grid" aria-label="Key metrics">
      {labels.map(({ key, label, detail, icon }) => (
        <article className={`kpi-card kpi-card--${key}`} key={key}>
          <div className="kpi-card-top">
            <p>{label}</p>
            <span className="kpi-icon" aria-hidden="true">
              {icon}
            </span>
          </div>
          <strong>{values[key].toLocaleString()}</strong>
          <span className="kpi-detail">{detail}</span>
        </article>
      ))}
    </section>
  );
})
