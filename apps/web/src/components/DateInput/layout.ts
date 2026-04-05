import type { CSSProperties } from 'react';
import type { DateInputType } from './types';

const MARGIN = 12;
const GAP = 10;
const ESTIMATED_POPOVER_HEIGHT = 300;

export function computePopoverFixedStyle(
  type: DateInputType,
  triggerRect: DOMRect,
  measuredPopoverHeight: number,
): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minWidth = type === 'datetime-local' ? 300 : 288;
  const width = Math.max(triggerRect.width, minWidth);
  const left = Math.max(
    MARGIN,
    Math.min(triggerRect.left, vw - width - MARGIN),
  );

  const h =
    measuredPopoverHeight > 0
      ? measuredPopoverHeight
      : ESTIMATED_POPOVER_HEIGHT;

  const roomBelow = vh - triggerRect.bottom - GAP - MARGIN;
  const roomAbove = triggerRect.top - GAP - MARGIN;

  let top: number;
  let maxHeight: number | undefined;

  if (h <= roomBelow) {
    top = triggerRect.bottom + GAP;
  } else if (h <= roomAbove) {
    top = triggerRect.top - h - GAP;
  } else if (roomBelow >= roomAbove) {
    top = triggerRect.bottom + GAP;
    maxHeight = Math.max(220, roomBelow);
  } else {
    maxHeight = Math.max(220, roomAbove);
    top = Math.max(MARGIN, triggerRect.top - GAP - maxHeight);
  }

  return {
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
  };
}
