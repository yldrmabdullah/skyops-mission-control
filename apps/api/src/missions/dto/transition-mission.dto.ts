import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MissionStatus } from '../entities/mission.entity';

export class TransitionMissionDto {
  @ApiProperty({ enum: MissionStatus })
  @IsEnum(MissionStatus)
  status!: MissionStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  actualStart?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  actualEnd?: string;

  @ApiProperty({ required: false, example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  @Max(500)
  flightHoursLogged?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  abortReason?: string;
}
