import type { ChangeEvent, ReactNode } from 'react'

interface SelectProps {
  id: string
  label?: string
  value: string
  onChange: (value: string, event: ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export function Select({ id, label, value, onChange, children, disabled, className = '', 'aria-label': ariaLabel }: SelectProps) {
  return (
    <div className={`select-field ${label ? 'select-field--labeled' : ''} ${className}`.trim()}>
      {label && <label className="select-label" htmlFor={id}>{label}</label>}
      <select id={id} className="select-control" value={value} onChange={(event) => onChange(event.target.value, event)} disabled={disabled} aria-label={ariaLabel ?? (label ? undefined : id)}>
        {children}
      </select>
    </div>
  )
}
