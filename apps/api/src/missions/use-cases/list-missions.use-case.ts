import { Injectable } from '@nestjs/common';
import { IMissionsRepository } from '../repositories/missions.repository.interface';
import { WorkspaceContext } from '../../common/workspace-context/workspace-context';
import { ListMissionsQueryDto } from '../dto/list-missions-query.dto';
import { buildPaginationMeta } from '../../common/utils/pagination';

@Injectable()
export class ListMissionsUseCase {
  constructor(
    private readonly missionsRepository: IMissionsRepository,
    private readonly workspaceContext: WorkspaceContext,
  ) {}

  async execute(query: ListMissionsQueryDto) {
    const fleetOwnerId = this.workspaceContext.fleetOwnerId;

    const [data, total] = await this.missionsRepository.findAll(fleetOwnerId, {
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      droneId: query.droneId,
      order: query.sortBy
        ? { [query.sortBy]: query.sortOrder || 'ASC' }
        : undefined,
    });

    return {
      data,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }
}
