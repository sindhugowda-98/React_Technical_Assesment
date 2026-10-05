import { Button } from '../ui'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <section className="error-state" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && <Button variant="secondary" type="button" onClick={onRetry}>Try again</Button>}
    </section>
  )
}
