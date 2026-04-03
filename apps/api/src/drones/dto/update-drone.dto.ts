import { PartialType } from '@nestjs/swagger';
import { CreateDroneDto } from './create-drone.dto';

export class UpdateDroneDto extends PartialType(CreateDroneDto) {}
