import type { ReactNode } from 'react'

type StatCardProps = { label: string; value: string; caption: string; icon: ReactNode; tone: string }

export function StatCard({ label, value, caption, icon, tone }: StatCardProps) {
  return <section className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon stat-${tone}`}>{icon}</span></div><div className="stat-bottom"><b>{value}</b></div><small>{caption}</small></section>
}
