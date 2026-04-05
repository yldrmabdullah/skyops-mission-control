import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailOnMaintenanceDue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inAppOnScheduleConflict?: boolean;
}
