import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MissionType } from '../entities/mission.entity';

export class CreateMissionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: MissionType })
  @IsEnum(MissionType)
  type!: MissionType;

  @ApiProperty()
  @IsUUID()
  droneId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  pilotName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(180)
  siteLocation!: string;

  @ApiProperty()
  @IsDateString()
  plannedStart!: string;

  @ApiProperty()
  @IsDateString()
  plannedEnd!: string;
}
