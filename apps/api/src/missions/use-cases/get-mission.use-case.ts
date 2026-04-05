import { Injectable, NotFoundException } from '@nestjs/common';
import { IMissionsRepository } from '../repositories/missions.repository.interface';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';

@Injectable()
export class GetMissionUseCase {
  constructor(
    private readonly missionsRepository: IMissionsRepository,
    private readonly workspaceContext: WorkspaceContext,
  ) { }

  async execute(id: string) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const mission = await this.missionsRepository.findOne(id, fleetOwnerId);
    if (!mission) {
      throw new NotFoundException(`Mission ${id} was not found.`);
    }

    return mission;
  }
}
