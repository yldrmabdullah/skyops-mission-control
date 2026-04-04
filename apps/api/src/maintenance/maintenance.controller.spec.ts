import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let service: MaintenanceService;

  const mockUser = { userId: 'user-1' };

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
    await controller.create(mockUser as any, {} as any);
    expect(service.create).toHaveBeenCalled();

    await controller.findAll(mockUser as any, { page: 1, limit: 10 });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should call addFileAttachment when file is present', async () => {
    const file = { buffer: Buffer.from('') } as any;
    await controller.uploadAttachment(mockUser as any, 'id-1', file);
    expect(service.addFileAttachment).toHaveBeenCalled();
  });
});
