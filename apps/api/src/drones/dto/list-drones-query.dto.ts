import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DroneStatus } from '../entities/drone.entity';

export class ListDronesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DroneStatus })
  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;

  @ApiPropertyOptional({
    description: 'Case-insensitive match on serial number (contains)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
