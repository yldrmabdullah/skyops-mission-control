import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface PriorityPillProps {
  label: string;
  tone: 'danger' | 'warning' | 'neutral';
  className?: string;
}

export function PriorityPill({ label, tone, className }: PriorityPillProps) {
  const variantMap = {
    danger: "error",
    warning: "warning",
    neutral: "secondary",
  } as const;

  return (
    <Badge 
      variant={variantMap[tone] || "secondary"} 
      className={cn("font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 whitespace-nowrap", className)}
    >
      {label}
    </Badge>
  );
}
