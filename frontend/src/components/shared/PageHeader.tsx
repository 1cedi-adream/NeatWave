import type { ReactNode } from 'react'

type PageHeaderProps = { title: string; description: string; action?: ReactNode }

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div>{action && <div className="heading-actions">{action}</div>}</div>
}
