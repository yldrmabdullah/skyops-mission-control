import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateDroneDto } from './dto/create-drone.dto';
import { ListDronesQueryDto } from './dto/list-drones-query.dto';
import { UpdateDroneDto } from './dto/update-drone.dto';
import { DronesService } from './drones.service';

@ApiTags('Drones')
@Controller('drones')
export class DronesController {
  constructor(private readonly dronesService: DronesService) {}

  @Post()
  create(@Body() createDroneDto: CreateDroneDto) {
    return this.dronesService.create(createDroneDto);
  }

  @Get()
  findAll(@Query() query: ListDronesQueryDto) {
    return this.dronesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dronesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDroneDto: UpdateDroneDto) {
    return this.dronesService.update(id, updateDroneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dronesService.remove(id);
  }
}
