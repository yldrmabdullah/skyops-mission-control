import { Test, TestingModule } from '@nestjs/testing';
import { MissionsController } from './missions.controller';
import { CreateMissionUseCase } from './use-cases/create-mission.use-case';
import { ListMissionsUseCase } from './use-cases/list-missions.use-case';
import { GetMissionUseCase } from './use-cases/get-mission.use-case';
import { UpdateMissionUseCase } from './use-cases/update-mission.use-case';
import { TransitionMissionUseCase } from './use-cases/transition-mission.use-case';
import { MissionStatus, MissionType } from './entities/mission.entity';

describe('MissionsController', () => {
  let controller: MissionsController;
  let createMission: CreateMissionUseCase;
  let listMissions: ListMissionsUseCase;
  let getMission: GetMissionUseCase;
  let updateMission: UpdateMissionUseCase;
  let transitionMission: TransitionMissionUseCase;

  const createDto = {
    name: 'Mission',
    type: MissionType.WIND_TURBINE_INSPECTION,
    droneId: 'd1',
    pilotName: 'Pilot',
    siteLocation: 'Site',
    plannedStart: new Date().toISOString(),
    plannedEnd: new Date(Date.now() + 3600_000).toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MissionsController],
      providers: [
        { provide: CreateMissionUseCase, useValue: { execute: jest.fn() } },
        { provide: ListMissionsUseCase, useValue: { execute: jest.fn() } },
        { provide: GetMissionUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateMissionUseCase, useValue: { execute: jest.fn() } },
        { provide: TransitionMissionUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<MissionsController>(MissionsController);
    createMission = module.get<CreateMissionUseCase>(CreateMissionUseCase);
    listMissions = module.get<ListMissionsUseCase>(ListMissionsUseCase);
    getMission = module.get<GetMissionUseCase>(GetMissionUseCase);
    updateMission = module.get<UpdateMissionUseCase>(UpdateMissionUseCase);
    transitionMission = module.get<TransitionMissionUseCase>(TransitionMissionUseCase);
  });

  it('should delegate to use cases for all methods', async () => {
    await controller.create(createDto as any);
    expect(createMission.execute).toHaveBeenCalledWith(createDto);

    await controller.findAll({ page: 1, limit: 10 } as any);
    expect(listMissions.execute).toHaveBeenCalled();

    await controller.findOne('m1');
    expect(getMission.execute).toHaveBeenCalledWith('m1');

    await controller.update('m1', {} as any);
    expect(updateMission.execute).toHaveBeenCalledWith('m1', {});

    await controller.transition('m1', { status: MissionStatus.PRE_FLIGHT_CHECK } as any);
    expect(transitionMission.execute).toHaveBeenCalledWith('m1', { status: MissionStatus.PRE_FLIGHT_CHECK });
  });
});
