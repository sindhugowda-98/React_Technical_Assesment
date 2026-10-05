import type { OptionHTMLAttributes, PropsWithChildren } from 'react'

type OptionProps = PropsWithChildren<OptionHTMLAttributes<HTMLOptionElement>>

export function Option({ children, ...props }: OptionProps) {
  return <option {...props}>{children}</option>
}
