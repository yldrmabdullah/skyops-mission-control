import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { IMissionsRepository } from '../repositories/missions.repository.interface';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { CancelMissionDto } from '../dto/cancel-mission.dto';
import { MissionStatus } from '../entities/mission.entity';

@Injectable()
export class CancelMissionUseCase {
  constructor(
    private readonly missionsRepository: IMissionsRepository,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  async execute(id: string, dto: CancelMissionDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const mission = await this.missionsRepository.findOne(id, fleetOwnerId);
    if (!mission) {
      throw new NotFoundException(`Mission ${id} was not found.`);
    }

    if (mission.status !== MissionStatus.PLANNED) {
      throw new ConflictException('Only planned missions can be cancelled.');
    }

    mission.status = MissionStatus.ABORTED;
    mission.abortReason = dto.reason;
    mission.actualEnd = new Date();

    return this.missionsRepository.save(mission);
  }
}
