import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OperatorRole } from '../auth/operator-role.enum';
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
  @ApiOperation({ summary: 'Register a drone (Manager only)' })
  @ApiResponse({ status: 201, description: 'Drone created' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 409, description: 'Serial number conflict' })
  @UseGuards(RolesGuard)
  @Roles(OperatorRole.MANAGER)
  create(@Body() createDroneDto: CreateDroneDto) {
    return this.dronesService.create(createDroneDto);
  }

  @Get()
  @ApiOperation({ summary: 'List drones for the current operator' })
  @ApiResponse({ status: 200, description: 'Paginated drones' })
  findAll(@Query() query: ListDronesQueryDto) {
    return this.dronesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one drone with relations' })
  @ApiResponse({ status: 200, description: 'Drone detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dronesService.findOne(id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update drone profile (Manager only)' })
  @ApiResponse({ status: 200, description: 'Updated drone' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @UseGuards(RolesGuard)
  @Roles(OperatorRole.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDroneDto: UpdateDroneDto,
  ) {
    return this.dronesService.update(id, updateDroneDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete drone (Manager only, no history)' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 400, description: 'Has missions or maintenance' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @UseGuards(RolesGuard)
  @Roles(OperatorRole.MANAGER)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dronesService.remove(id);
  }
}
