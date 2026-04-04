/**
 * Parses decimal strings with either comma or period as the separator (TR / EN keyboards).
 * Supports forms like "12,5", "12.5", "1.234,56" and "1,234.56" for fractional values.
 */
export function parseLocaleDecimal(input: string): number {
  const s = input.trim().replace(/\s/g, '');
  if (s === '') {
    return NaN;
  }

  let normalized = s;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      normalized = s.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    normalized = s.replace(',', '.');
  }

  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export function parseLocaleDecimalOrZero(input: string): number {
  const s = input.trim();
  if (s === '') {
    return 0;
  }
  const n = parseLocaleDecimal(s);
  return Number.isFinite(n) ? n : NaN;
}
