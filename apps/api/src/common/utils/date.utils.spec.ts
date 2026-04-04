import { BadRequestException } from '@nestjs/common';
import {
  assertOrderedDateRangeOrThrow,
  parseIsoDateOrThrow,
} from './date.utils';

describe('date.utils', () => {
  describe('parseIsoDateOrThrow', () => {
    it('returns a Date for valid ISO strings', () => {
      const d = parseIsoDateOrThrow('2026-01-15T12:00:00.000Z', 'test');
      expect(d.toISOString()).toBe('2026-01-15T12:00:00.000Z');
    });

    it('throws for invalid strings', () => {
      expect(() => parseIsoDateOrThrow('not-a-date', 'startedAt')).toThrow(
        BadRequestException,
      );
      expect(() => parseIsoDateOrThrow('not-a-date', 'startedAt')).toThrow(
        /startedAt is not a valid date/,
      );
    });
  });

  describe('assertOrderedDateRangeOrThrow', () => {
    it('allows equal bounds', () => {
      const t = new Date('2026-02-01T00:00:00.000Z');
      expect(() =>
        assertOrderedDateRangeOrThrow(t, t, 'from', 'to'),
      ).not.toThrow();
    });

    it('throws when start is after end', () => {
      const a = new Date('2026-03-01T00:00:00.000Z');
      const b = new Date('2026-02-01T00:00:00.000Z');
      expect(() =>
        assertOrderedDateRangeOrThrow(a, b, 'startDate', 'endDate'),
      ).toThrow(BadRequestException);
    });
  });
});
