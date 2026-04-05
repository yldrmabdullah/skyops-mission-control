import { Test, TestingModule } from '@nestjs/testing';
import { createMockJwtUser } from '../test-utils/mock-jwt-user';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { MissionStatus, MissionType } from './entities/mission.entity';
import { TransitionMissionDto } from './dto/transition-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

describe('MissionsController', () => {
  let controller: MissionsController;
  let service: MissionsService;

  const mockUser = createMockJwtUser();

  const createDto: CreateMissionDto = {
    name: 'Mission',
    type: MissionType.WIND_TURBINE_INSPECTION,
    droneId: 'd1',
    pilotName: 'Pilot',
    siteLocation: 'Site',
    plannedStart: new Date().toISOString(),
    plannedEnd: new Date(Date.now() + 3600_000).toISOString(),
  };

  const updateDto: UpdateMissionDto = {};
  const transitionDto: TransitionMissionDto = {
    status: MissionStatus.PRE_FLIGHT_CHECK,
  };

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
    await controller.create(mockUser, createDto);
    expect(service.create).toHaveBeenCalled();

    await controller.findAll(mockUser, { page: 1, limit: 10 });
    expect(service.findAll).toHaveBeenCalled();

    await controller.findOne(mockUser, 'm1');
    expect(service.findOne).toHaveBeenCalled();

    await controller.update(mockUser, 'm1', updateDto);
    expect(service.update).toHaveBeenCalled();

    await controller.transition(mockUser, 'm1', transitionDto);
    expect(service.transition).toHaveBeenCalled();
  });
});
