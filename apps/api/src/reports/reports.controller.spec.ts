import { Test, TestingModule } from '@nestjs/testing';
import { createMockJwtUser } from '../test-utils/mock-jwt-user';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockUser = createMockJwtUser();

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
    await controller.getFleetHealthReport(mockUser);
    expect(service.getFleetHealthReport).toHaveBeenCalled();

    await controller.getOperationalAnalytics(mockUser);
    expect(service.getOperationalAnalytics).toHaveBeenCalled();
  });
});
