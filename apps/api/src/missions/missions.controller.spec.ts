import { Test, TestingModule } from '@nestjs/testing';
import { MissionsController } from './missions.controller';
import { CreateMissionUseCase } from './use-cases/create-mission.use-case';
import { ListMissionsUseCase } from './use-cases/list-missions.use-case';
import { GetMissionUseCase } from './use-cases/get-mission.use-case';
import { UpdateMissionUseCase } from './use-cases/update-mission.use-case';
import { TransitionMissionUseCase } from './use-cases/transition-mission.use-case';
import { CancelMissionUseCase } from './use-cases/cancel-mission.use-case';
import { CreateMissionDto } from './dto/create-mission.dto';
import { ListMissionsQueryDto } from './dto/list-missions-query.dto';
import { TransitionMissionDto } from './dto/transition-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionStatus, MissionType } from './entities/mission.entity';

describe('MissionsController', () => {
  let controller: MissionsController;
  let createMission: CreateMissionUseCase;
  let listMissions: ListMissionsUseCase;
  let getMission: GetMissionUseCase;
  let updateMission: UpdateMissionUseCase;
  let cancelMission: CancelMissionUseCase;
  let transitionMission: TransitionMissionUseCase;

  const createDto: CreateMissionDto = {
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
        { provide: CancelMissionUseCase, useValue: { execute: jest.fn() } },
        { provide: TransitionMissionUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<MissionsController>(MissionsController);
    createMission = module.get<CreateMissionUseCase>(CreateMissionUseCase);
    listMissions = module.get<ListMissionsUseCase>(ListMissionsUseCase);
    getMission = module.get<GetMissionUseCase>(GetMissionUseCase);
    updateMission = module.get<UpdateMissionUseCase>(UpdateMissionUseCase);
    cancelMission = module.get<CancelMissionUseCase>(CancelMissionUseCase);
    transitionMission = module.get<TransitionMissionUseCase>(
      TransitionMissionUseCase,
    );
  });

  it('should delegate to use cases for all methods', async () => {
    await controller.create(createDto);
    expect(createMission.execute).toHaveBeenCalledWith(createDto);

    const listQuery: ListMissionsQueryDto = { page: 1, limit: 10 };
    await controller.findAll(listQuery);
    expect(listMissions.execute).toHaveBeenCalled();

    await controller.findOne('m1');
    expect(getMission.execute).toHaveBeenCalledWith('m1');

    const updateDto = {} as UpdateMissionDto;
    await controller.update('m1', updateDto);
    expect(updateMission.execute).toHaveBeenCalledWith('m1', updateDto);

    const transitionDto: TransitionMissionDto = {
      status: MissionStatus.PRE_FLIGHT_CHECK,
    };
    await controller.transition('m1', transitionDto);
    expect(transitionMission.execute).toHaveBeenCalledWith('m1', transitionDto);

    await controller.cancel('m1', { reason: 'Aborted' });
    expect(cancelMission.execute).toHaveBeenCalledWith('m1', {
      reason: 'Aborted',
    });
  });
});
