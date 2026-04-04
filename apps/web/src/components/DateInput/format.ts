import { format, isValid, parse } from 'date-fns';
import type { DateInputType } from './types';

export function parseControlledValue(
  raw: string,
  kind: DateInputType,
): Date | undefined {
  if (!raw?.trim()) return undefined;
  if (kind === 'date') {
    const parsed = parse(raw, 'yyyy-MM-dd', new Date());
    return isValid(parsed) ? parsed : undefined;
  }
  const parsed = parse(raw, "yyyy-MM-dd'T'HH:mm", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function toOutputString(date: Date, kind: DateInputType): string {
  if (kind === 'date') {
    return format(date, 'yyyy-MM-dd');
  }
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
