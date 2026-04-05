import { Test, TestingModule } from '@nestjs/testing';
import type { Express } from 'express';
import { OperatorRole } from '../auth/operator-role.enum';
import { createMockJwtUser } from '../test-utils/mock-jwt-user';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { ListMaintenanceLogsQueryDto } from './dto/list-maintenance-logs-query.dto';
import { MaintenanceType } from './entities/maintenance-log.entity';

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let service: MaintenanceService;

  const mockUser = createMockJwtUser({ role: OperatorRole.TECHNICIAN });

  const createDto: CreateMaintenanceLogDto = {
    droneId: '00000000-0000-4000-8000-000000000001',
    type: MaintenanceType.ROUTINE_CHECK,
    technicianName: 'Tech',
    performedAt: new Date().toISOString(),
    flightHoursAtMaintenance: 0,
  };

  const listQuery: ListMaintenanceLogsQueryDto = {
    page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        {
          provide: MaintenanceService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            addFileAttachment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MaintenanceController>(MaintenanceController);
    service = module.get<MaintenanceService>(MaintenanceService);
  });

  it('should delegate to service', async () => {
    await controller.create(mockUser, createDto);
    expect(service.create).toHaveBeenCalled();

    await controller.findAll(mockUser, listQuery);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should call addFileAttachment when file is present', async () => {
    const file = { buffer: Buffer.from('') } as Express.Multer.File;
    await controller.uploadAttachment(mockUser, 'id-1', file);
    expect(service.addFileAttachment).toHaveBeenCalled();
  });
});
