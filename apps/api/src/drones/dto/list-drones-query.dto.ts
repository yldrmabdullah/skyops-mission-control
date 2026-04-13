import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DroneStatus } from '../entities/drone.entity';
import { DroneListSortField, DroneListSortOrder } from './drone-list-sort.enum';
import { DroneModel } from '../entities/drone.entity';

export class ListDronesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DroneListSortField })
  @IsOptional()
  @IsEnum(DroneListSortField)
  sortBy?: DroneListSortField;

  @ApiPropertyOptional({ enum: DroneListSortOrder })
  @IsOptional()
  @IsEnum(DroneListSortOrder)
  sortOrder?: DroneListSortOrder;

  @ApiPropertyOptional({ enum: DroneStatus })
  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;

  @ApiPropertyOptional({ enum: DroneModel })
  @IsOptional()
  @IsEnum(DroneModel)
  model?: DroneModel;

  @ApiPropertyOptional({
    description: 'Case-insensitive match on serial number (contains)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
