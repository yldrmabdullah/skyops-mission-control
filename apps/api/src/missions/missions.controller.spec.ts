import { Test, TestingModule } from '@nestjs/testing';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';

describe('MissionsController', () => {
  let controller: MissionsController;
  let service: MissionsService;

  const mockUser = { userId: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MissionsController],
      providers: [
        {
          provide: MissionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            transition: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MissionsController>(MissionsController);
    service = module.get<MissionsService>(MissionsService);
  });

  it('should delegate to service for all methods', async () => {
    await controller.create(mockUser as any, { droneId: 'd1' } as any);
    expect(service.create).toHaveBeenCalled();

    await controller.findAll(mockUser as any, { page: 1, limit: 10 });
    expect(service.findAll).toHaveBeenCalled();

    await controller.findOne(mockUser as any, 'm1');
    expect(service.findOne).toHaveBeenCalled();

    await controller.update(mockUser as any, 'm1', {} as any);
    expect(service.update).toHaveBeenCalled();

    await controller.transition(mockUser as any, 'm1', {} as any);
    expect(service.transition).toHaveBeenCalled();
  });
});
