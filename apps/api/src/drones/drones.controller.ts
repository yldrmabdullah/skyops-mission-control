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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../auth/strategies/jwt.strategy';
import { CreateDroneDto } from './dto/create-drone.dto';
import { ListDronesQueryDto } from './dto/list-drones-query.dto';
import { UpdateDroneDto } from './dto/update-drone.dto';
import { DronesService } from './drones.service';

@ApiTags('Drones')
@ApiBearerAuth('access-token')
@Controller('drones')
export class DronesController {
  constructor(private readonly dronesService: DronesService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createDroneDto: CreateDroneDto,
  ) {
    return this.dronesService.create(createDroneDto, user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: ListDronesQueryDto,
  ) {
    return this.dronesService.findAll(query, user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.dronesService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() updateDroneDto: UpdateDroneDto,
  ) {
    return this.dronesService.update(id, updateDroneDto, user.userId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.dronesService.remove(id, user.userId);
  }
}
