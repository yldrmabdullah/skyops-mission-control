import { formatEnumLabel } from '../lib/format';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface StatusPillProps {
  value: string;
  className?: string;
}

export function StatusPill({ value, className }: StatusPillProps) {
  const status = value.toUpperCase();
  
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" = "secondary";

  if (["AVAILABLE", "COMPLETED", "SUCCESS", "READY", "CHARGING"].includes(status)) {
    variant = "success";
  } else if (["IN_MISSION", "IN_PROGRESS", "ACTIVE", "PLANNED", "ON_SITE"].includes(status)) {
    variant = "info";
  } else if (["MAINTENANCE", "WARNING", "PRE_FLIGHT_CHECK", "LOW_BATTERY"].includes(status)) {
    variant = "warning";
  } else if (["RETIRED", "ABORTED", "FAILED", "ERROR", "CRITICAL", "OFFLINE"].includes(status)) {
    variant = "error";
  }

  return (
    <Badge variant={variant} className={cn("font-semibold tracking-tight shadow-sm whitespace-nowrap", className)}>
      {formatEnumLabel(value)}
    </Badge>
  );
}
