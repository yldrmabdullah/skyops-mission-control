import { BadRequestException } from '@nestjs/common';

export function parseIsoDateOrThrow(value: string, fieldLabel: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldLabel} is not a valid date.`);
  }
  return parsed;
}

export function assertOrderedDateRangeOrThrow(
  start: Date,
  end: Date,
  startLabel: string,
  endLabel: string,
) {
  if (start.getTime() > end.getTime()) {
    throw new BadRequestException(
      `${startLabel} must be on or before ${endLabel}.`,
    );
  }
}
