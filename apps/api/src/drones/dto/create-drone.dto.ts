import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';
import { DroneModel, DroneStatus } from '../entities/drone.entity';
import { DRONE_SERIAL_NUMBER_REGEX } from '../utils/maintenance.utils';

export class CreateDroneDto {
  @ApiProperty({ example: 'SKY-A1B2-C3D4' })
  @Matches(DRONE_SERIAL_NUMBER_REGEX)
  serialNumber!: string;

  @ApiProperty({ enum: DroneModel })
  @IsEnum(DroneModel)
  model!: DroneModel;

  @ApiProperty({
    enum: DroneStatus,
    required: false,
    default: DroneStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;

  @ApiProperty({ example: 12.5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  totalFlightHours?: number;

  @ApiProperty({ example: '2026-04-01T08:30:00.000Z' })
  @IsDateString()
  lastMaintenanceDate!: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  flightHoursAtLastMaintenance?: number;
}
