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
import { format, startOfMonth } from 'date-fns';
import 'react-day-picker/style.css';
import { CalendarIcon } from './CalendarIcon';
import { parseControlledValue, toOutputString } from './format';
import { computePopoverFixedStyle } from './layout';
import type { CSSProperties } from 'react';
import type { DateInputProps } from './types';

export type { DateInputProps, DateInputType } from './types';

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
    const measured = pop?.offsetHeight ?? 0;
    setPopoverStyle(computePopoverFixedStyle(type, r, measured));
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
    next.setHours(
      Number.isFinite(hh) ? hh : 0,
      Number.isFinite(mm) ? mm : 0,
      0,
      0,
    );
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
        weekStartsOn={1}
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
            displayValue
              ? `${label}, ${displayValue}`
              : `${label}, not selected`
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
