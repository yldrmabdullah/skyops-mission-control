import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperatorRole } from '../auth/operator-role.enum';
import { AuditService } from './audit.service';
import { AuditEvent } from './entities/audit-event.entity';

describe('AuditService', () => {
  let service: AuditService;
  let repository: Repository<AuditEvent>;
  let createQueryBuilder: jest.Mock;

  beforeEach(async () => {
    const getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
    const qb = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount,
    };
    createQueryBuilder = jest.fn().mockReturnValue(qb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditEvent),
          useValue: {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
            createQueryBuilder,
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<Repository<AuditEvent>>(
      getRepositoryToken(AuditEvent),
    );
  });

  it('should successfully record an audit log', async () => {
    await service.record('user-1', 'ACTION', 'Entity', 'target-1', { data: 1 });
    expect(repository.save).toHaveBeenCalled();
  });

  it('should find logs filtered by actorUserId', async () => {
    const result = await service.findForActor('user-1', 1, 10);
    expect(result.data).toBeInstanceOf(Array);
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { actorUserId: 'user-1' },
      }),
    );
  });

  it('findVisibleToUser delegates to actor scope for pilots', async () => {
    await service.findVisibleToUser(
      {
        userId: 'user-1',
        email: 'p@x.com',
        role: OperatorRole.PILOT,
        fleetOwnerId: 'user-1',
      },
      1,
      10,
    );
    expect(repository.findAndCount).toHaveBeenCalled();
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });

  it('findVisibleToUser uses fleet-scoped query for managers', async () => {
    await service.findVisibleToUser(
      {
        userId: 'user-1',
        email: 'm@x.com',
        role: OperatorRole.MANAGER,
        fleetOwnerId: 'user-1',
      },
      1,
      10,
    );
    expect(createQueryBuilder).toHaveBeenCalledWith('e');
  });
});
