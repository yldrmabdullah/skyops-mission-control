import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { MissionStatus } from '../entities/mission.entity';
import { MissionListSortField, MissionListSortOrder } from './mission-list-sort.enum';

export class ListMissionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MissionListSortField })
  @IsOptional()
  @IsEnum(MissionListSortField)
  sortBy?: MissionListSortField;

  @ApiPropertyOptional({ enum: MissionListSortOrder })
  @IsOptional()
  @IsEnum(MissionListSortOrder)
  sortOrder?: MissionListSortOrder;

  @ApiPropertyOptional({ enum: MissionStatus })
  @IsOptional()
  @IsEnum(MissionStatus)
  status?: MissionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  droneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive contains on mission name or pilot name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
