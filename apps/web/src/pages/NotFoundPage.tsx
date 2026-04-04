import { StatePanel } from '../components/StatePanel';

export function NotFoundPage() {
  return (
    <StatePanel
      actionHref="/dashboard"
      actionLabel="Return to dashboard"
      description="The page you requested does not exist or may have been moved."
      title="Page not found"
      tone="warning"
    />
  );
}
