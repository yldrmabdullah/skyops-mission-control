interface PriorityPillProps {
  label: string;
  tone: 'danger' | 'warning' | 'neutral';
}

export function PriorityPill({ label, tone }: PriorityPillProps) {
  return <span className={`priority-pill ${tone}`}>{label}</span>;
}
