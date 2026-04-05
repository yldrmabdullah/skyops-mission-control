import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { OperatorRole } from '../auth/operator-role.enum';
import type { JwtPayloadUser } from '../auth/strategies/jwt.strategy';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ListMissionsQueryDto } from './dto/list-missions-query.dto';
import { TransitionMissionDto } from './dto/transition-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionsService } from './missions.service';

@ApiTags('Missions')
@ApiBearerAuth('access-token')
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a mission' })
  @ApiResponse({ status: 201, description: 'Mission created' })
  @ApiResponse({ status: 400, description: 'Validation or overlap' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @Roles(OperatorRole.PILOT, OperatorRole.MANAGER)
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createMissionDto: CreateMissionDto,
  ) {
    return this.missionsService.create(
      createMissionDto,
      user.fleetOwnerId,
      user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List missions for the operator fleet' })
  @ApiResponse({ status: 200, description: 'Paginated missions' })
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: ListMissionsQueryDto,
  ) {
    return this.missionsService.findAll(query, user.fleetOwnerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one mission' })
  @ApiResponse({ status: 200, description: 'Mission detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.missionsService.findOne(id, user.fleetOwnerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a planned mission' })
  @ApiResponse({ status: 200, description: 'Updated mission' })
  @ApiResponse({ status: 400, description: 'Not editable state' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(OperatorRole.PILOT, OperatorRole.MANAGER)
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMissionDto: UpdateMissionDto,
  ) {
    return this.missionsService.update(id, updateMissionDto, user.fleetOwnerId);
  }

  @Patch(':id/transition')
  @ApiOperation({ summary: 'Transition mission status' })
  @ApiResponse({ status: 200, description: 'Updated mission' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(OperatorRole.PILOT, OperatorRole.MANAGER)
  transition(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() transitionMissionDto: TransitionMissionDto,
  ) {
    return this.missionsService.transition(
      id,
      transitionMissionDto,
      user.fleetOwnerId,
      user.userId,
    );
  }
}
