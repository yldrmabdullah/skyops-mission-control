import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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
  create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createMissionDto: CreateMissionDto,
  ) {
    return this.missionsService.create(createMissionDto, user.userId);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: ListMissionsQueryDto,
  ) {
    return this.missionsService.findAll(query, user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.missionsService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() updateMissionDto: UpdateMissionDto,
  ) {
    return this.missionsService.update(id, updateMissionDto, user.userId);
  }

  @Patch(':id/transition')
  transition(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() transitionMissionDto: TransitionMissionDto,
  ) {
    return this.missionsService.transition(
      id,
      transitionMissionDto,
      user.userId,
    );
  }
}
