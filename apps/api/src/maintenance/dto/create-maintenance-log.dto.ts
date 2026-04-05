import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
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
  @MinLength(1)
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

  @ApiProperty({
    required: false,
    description: 'External links to evidence (max 5)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  attachmentUrls?: string[];
}
