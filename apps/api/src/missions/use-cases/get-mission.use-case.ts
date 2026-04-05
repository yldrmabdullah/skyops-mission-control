import { Injectable } from '@nestjs/common';
import { IMissionsRepository } from '../repositories/missions.repository.interface';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { MissionNotFoundException } from '../exceptions/mission-specific.exceptions';

@Injectable()
export class GetMissionUseCase {
  constructor(
    private readonly missionsRepository: IMissionsRepository,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  async execute(id: string) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const mission = await this.missionsRepository.findOne(id, fleetOwnerId);
    if (!mission) {
      throw new MissionNotFoundException(id);
    }

    return mission;
  }
}
