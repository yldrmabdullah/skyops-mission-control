import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperatorRole } from '../auth/operator-role.enum';
import type { JwtPayloadUser } from '../auth/strategies/jwt.strategy';
import { AuditEvent } from './entities/audit-event.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepository: Repository<AuditEvent>,
  ) {}

  async record(
    actorUserId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    const row = this.auditRepository.create({
      actorUserId,
      action,
      entityType,
      entityId,
      metadata: metadata ?? null,
    });
    await this.auditRepository.save(row);
  }

  async findForActor(
    actorUserId: string,
    page: number,
    limit: number,
  ): Promise<{ data: AuditEvent[]; total: number }> {
    const [data, total] = await this.auditRepository.findAndCount({
      where: { actorUserId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  /**
   * Pilots and technicians see only events they authored.
   * Managers additionally see every audit event tied to drones they own (fleet-scoped trail).
   */
  async findVisibleToUser(
    user: JwtPayloadUser,
    page: number,
    limit: number,
  ): Promise<{ data: AuditEvent[]; total: number }> {
    if (user.role !== OperatorRole.MANAGER) {
      return this.findForActor(user.userId, page, limit);
    }

    const fleetScopeId = user.fleetOwnerId;

    const qb = this.auditRepository
      .createQueryBuilder('e')
      .where('e.actorUserId = :actorId', { actorId: user.userId })
      .orWhere(
        `(e.entityType = 'Drone' AND e.entityId IN (SELECT d.id FROM drones d WHERE d."ownerId" = :fleetScopeId))`,
        { fleetScopeId },
      )
      .orWhere(
        `(e.entityType = 'Mission' AND EXISTS (SELECT 1 FROM missions m INNER JOIN drones d ON m."droneId" = d.id WHERE m.id = e.entityId AND d."ownerId" = :fleetScopeId))`,
        { fleetScopeId },
      )
      .orWhere(
        `(e.entityType = 'MaintenanceLog' AND EXISTS (SELECT 1 FROM maintenance_logs ml INNER JOIN drones d ON ml."droneId" = d.id WHERE ml.id = e.entityId AND d."ownerId" = :fleetScopeId))`,
        { fleetScopeId },
      )
      .orderBy('e.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
