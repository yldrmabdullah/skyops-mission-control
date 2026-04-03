import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DroneStatus } from '../entities/drone.entity';

export class ListDronesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DroneStatus })
  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;
}
