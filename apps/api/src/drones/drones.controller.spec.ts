import { Test, TestingModule } from '@nestjs/testing';
import { createMockJwtUser } from '../test-utils/mock-jwt-user';
import { DronesController } from './drones.controller';
import { DronesService } from './drones.service';
import { DroneModel } from './entities/drone.entity';

describe('DronesController', () => {
  let controller: DronesController;
  let service: DronesService;

  const mockUser = createMockJwtUser();
  const mockDrone = { id: 'drone-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DronesController],
      providers: [
        {
          provide: DronesService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockDrone),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue(mockDrone),
            remove: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<DronesController>(DronesController);
    service = module.get<DronesService>(DronesService);
  });

  it('should use correct enum in create', async () => {
    const dto = {
      serialNumber: 'SN-1',
      model: DroneModel.MAVIC_3_ENTERPRISE,
      lastMaintenanceDate: '2024-01-01',
    };
    await controller.create(mockUser, dto);
    expect(service.create).toHaveBeenCalledWith(dto, 'user-1', 'user-1');
  });
});
