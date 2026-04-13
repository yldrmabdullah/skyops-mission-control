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
import { Roles } from '../auth/decorators/roles.decorator';
import { OperatorRole } from '../auth/operator-role.enum';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ListMissionsQueryDto } from './dto/list-missions-query.dto';
import { TransitionMissionDto } from './dto/transition-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { CreateMissionUseCase } from './use-cases/create-mission.use-case';
import { ListMissionsUseCase } from './use-cases/list-missions.use-case';
import { GetMissionUseCase } from './use-cases/get-mission.use-case';
import { UpdateMissionUseCase } from './use-cases/update-mission.use-case';
import { CancelMissionDto } from './dto/cancel-mission.dto';
import { CancelMissionUseCase } from './use-cases/cancel-mission.use-case';
import { TransitionMissionUseCase } from './use-cases/transition-mission.use-case';
import { Audit } from '../common/audit/audit.decorator';

@ApiTags('Missions')
@ApiBearerAuth('access-token')
@Controller('missions')
export class MissionsController {
  constructor(
    private readonly createMission: CreateMissionUseCase,
    private readonly listMissions: ListMissionsUseCase,
    private readonly getMission: GetMissionUseCase,
    private readonly updateMission: UpdateMissionUseCase,
    private readonly cancelMission: CancelMissionUseCase,
    private readonly transitionMission: TransitionMissionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a mission' })
  @Audit({ action: 'MISSION_CREATED', entityType: 'Mission' })
  @ApiResponse({ status: 201, description: 'Mission created' })
  @ApiResponse({ status: 400, description: 'Validation or overlap' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @Roles(OperatorRole.PILOT, OperatorRole.MANAGER)
  create(@Body() createMissionDto: CreateMissionDto) {
    return this.createMission.execute(createMissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List missions for the operator fleet' })
  @ApiResponse({ status: 200, description: 'Paginated missions' })
  findAll(@Query() query: ListMissionsQueryDto) {
    return this.listMissions.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one mission' })
  @ApiResponse({ status: 200, description: 'Mission detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getMission.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a planned mission' })
  @Audit({ action: 'MISSION_UPDATED', entityType: 'Mission' })
  @ApiResponse({ status: 200, description: 'Updated mission' })
  @ApiResponse({ status: 400, description: 'Not editable state' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(OperatorRole.PILOT, OperatorRole.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMissionDto: UpdateMissionDto,
  ) {
    return this.updateMission.execute(id, updateMissionDto);
  }

  @Patch(':id/transition')
  @ApiOperation({ summary: 'Transition mission status' })
  @Audit({ action: 'MISSION_TRANSITIONED', entityType: 'Mission' })
  @ApiResponse({ status: 200, description: 'Updated mission' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(OperatorRole.PILOT, OperatorRole.MANAGER)
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() transitionMissionDto: TransitionMissionDto,
  ) {
    return this.transitionMission.execute(id, transitionMissionDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a planned mission' })
  @Audit({ action: 'MISSION_CANCELLED', entityType: 'Mission' })
  @ApiResponse({ status: 200, description: 'Mission cancelled' })
  @ApiResponse({ status: 400, description: 'Not editable state' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Roles(OperatorRole.PILOT, OperatorRole.MANAGER)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelMissionDto: CancelMissionDto,
  ) {
    return this.cancelMission.execute(id, cancelMissionDto);
  }
}
