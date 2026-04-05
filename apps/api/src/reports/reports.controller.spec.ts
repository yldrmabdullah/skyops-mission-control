import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockUser = { userId: 'user-1', fleetOwnerId: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            getFleetHealthReport: jest.fn(),
            getOperationalAnalytics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  it('should delegate to service', async () => {
    await controller.getFleetHealthReport(mockUser as any);
    expect(service.getFleetHealthReport).toHaveBeenCalledWith('user-1');

    await controller.getOperationalAnalytics(mockUser as any);
    expect(service.getOperationalAnalytics).toHaveBeenCalledWith('user-1');
  });
});
