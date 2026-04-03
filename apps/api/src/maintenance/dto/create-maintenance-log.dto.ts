import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceType } from '../entities/maintenance-log.entity';

export class CreateMaintenanceLogDto {
  @ApiProperty()
  @IsUUID()
  droneId!: string;

  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  technicianName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsDateString()
  performedAt!: string;

  @ApiProperty({ example: 51.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  flightHoursAtMaintenance!: number;
}
