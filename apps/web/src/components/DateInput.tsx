import type { CSSProperties } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { enUS } from 'date-fns/locale';
import { format, isValid, parse, startOfMonth } from 'date-fns';
import 'react-day-picker/style.css';

type DateInputType = 'date' | 'datetime-local';

interface DateInputProps {
  /** Smaller control + label (e.g. filter toolbars). */
  compact?: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: DateInputType;
  value: string;
}

function parseControlledValue(
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

function toOutputString(date: Date, kind: DateInputType): string {
  if (kind === 'date') {
    return format(date, 'yyyy-MM-dd');
  }
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function CalendarIcon() {
  return (
    <svg
      className="date-picker-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function DateInput({
  compact,
  label,
  onChange,
  required,
  type = 'date',
  value,
}: DateInputProps) {
  const labelId = useId();
  const dialogId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() =>
    startOfMonth(parseControlledValue(value, type) ?? new Date()),
  );
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const selected = parseControlledValue(value, type);

  const updatePopoverPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const pop = popoverRef.current;
    if (!trigger) return;

    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const gap = 10;
    const minWidth = type === 'datetime-local' ? 300 : 288;
    const width = Math.max(r.width, minWidth);
    const left = Math.max(margin, Math.min(r.left, vw - width - margin));

    const measured = pop?.offsetHeight ?? 0;
    const h = measured > 0 ? measured : 300;

    const roomBelow = vh - r.bottom - gap - margin;
    const roomAbove = r.top - gap - margin;

    let top: number;
    let maxHeight: number | undefined;

    if (h <= roomBelow) {
      top = r.bottom + gap;
    } else if (h <= roomAbove) {
      top = r.top - h - gap;
    } else if (roomBelow >= roomAbove) {
      top = r.bottom + gap;
      maxHeight = Math.max(220, roomBelow);
    } else {
      maxHeight = Math.max(220, roomAbove);
      top = Math.max(margin, r.top - gap - maxHeight);
    }

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      width,
      zIndex: 200,
      ...(maxHeight != null
        ? {
            maxHeight,
            overflowY: 'auto' as const,
          }
        : {}),
    });
  }, [type]);

  useLayoutEffect(() => {
    if (!open) return;

    triggerRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });

    updatePopoverPosition();

    const pop = popoverRef.current;
    let ro: ResizeObserver | null = null;
    if (pop && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updatePopoverPosition();
      });
      ro.observe(pop);
    }

    let raf0 = 0;
    let raf1 = 0;
    raf0 = requestAnimationFrame(() => {
      updatePopoverPosition();
      raf1 = requestAnimationFrame(() => updatePopoverPosition());
    });

    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      cancelAnimationFrame(raf0);
      cancelAnimationFrame(raf1);
      ro?.disconnect();
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [open, updatePopoverPosition, month, type]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleOpen = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        const d = parseControlledValue(value, type);
        setMonth(startOfMonth(d ?? new Date()));
      }
      return !wasOpen;
    });
  };

  const displayValue = selected
    ? type === 'date'
      ? format(selected, 'dd MMM yyyy', { locale: enUS })
      : format(selected, 'dd MMM yyyy, HH:mm', { locale: enUS })
    : null;

  const timeString = selected ? format(selected, 'HH:mm') : '00:00';

  const applyDateTime = (day: Date, time: string) => {
    const [hh, mm] = time.split(':').map((part) => parseInt(part, 10));
    const next = new Date(day);
    next.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
    onChange(toOutputString(next, 'datetime-local'));
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    if (type === 'date') {
      onChange(toOutputString(day, 'date'));
      setOpen(false);
      return;
    }
    const current = parseControlledValue(value, type);
    const t = current ? format(current, 'HH:mm') : timeString;
    applyDateTime(day, t);
  };

  const handleTimeChange = (nextTime: string) => {
    const current = parseControlledValue(value, type);
    const base = current ?? new Date();
    applyDateTime(base, nextTime);
  };

  const setToday = () => {
    const now = new Date();
    if (type === 'date') {
      onChange(toOutputString(now, 'date'));
    } else {
      onChange(toOutputString(now, 'datetime-local'));
    }
    setOpen(false);
  };

  const clearValue = () => {
    onChange('');
    setOpen(false);
  };

  const popover = open ? (
    <div
      ref={popoverRef}
      className="date-picker-popover"
      id={dialogId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      style={popoverStyle}
    >
      <DayPicker
        mode="single"
        locale={enUS}
        month={month}
        onMonthChange={setMonth}
        selected={selected}
        onSelect={handleDaySelect}
        showOutsideDays
      />

      {type === 'datetime-local' ? (
        <div className="date-picker-time-row">
          <span className="date-picker-time-label">Time</span>
          <input
            className="input date-picker-time-input"
            type="time"
            value={timeString}
            step={60}
            onChange={(event) => handleTimeChange(event.target.value)}
          />
        </div>
      ) : null}

      <div className="date-picker-footer">
        <button
          type="button"
          className="button secondary date-picker-footer-btn"
          onClick={setToday}
        >
          Today
        </button>
        {required ? null : (
          <button
            type="button"
            className="button secondary date-picker-footer-btn"
            onClick={clearValue}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={compact ? 'field field--date-compact' : 'field'}>
      <span className="field-label" id={labelId}>
        {label}
      </span>
      <div className="date-input-shell">
        <button
          ref={triggerRef}
          type="button"
          className="input date-picker-trigger"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-haspopup="dialog"
          aria-label={
            displayValue ? `${label}, ${displayValue}` : `${label}, not selected`
          }
          aria-required={required}
          onClick={toggleOpen}
        >
          <span className={displayValue ? undefined : 'muted'}>
            {displayValue ??
              (type === 'datetime-local'
                ? 'Select date & time'
                : 'Select date')}
          </span>
          <CalendarIcon />
        </button>
        {typeof document !== 'undefined' && popover != null
          ? createPortal(popover, document.body)
          : null}
      </div>
    </div>
  );
}
