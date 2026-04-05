import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { DronePersistenceModule } from '../drones/drone-persistence.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkspaceContextModule } from '../common/workspace-context/workspace-context.module';
import { Mission } from './entities/mission.entity';
import { MissionsController } from './missions.controller';
import { IMissionsRepository } from './repositories/missions.repository.interface';
import { TypeOrmMissionsRepository } from './repositories/typeorm-missions.repository';
import { CreateMissionUseCase } from './use-cases/create-mission.use-case';
import { ListMissionsUseCase } from './use-cases/list-missions.use-case';
import { TransitionMissionUseCase } from './use-cases/transition-mission.use-case';
import { UpdateMissionUseCase } from './use-cases/update-mission.use-case';
import { GetMissionUseCase } from './use-cases/get-mission.use-case';

@Module({
  imports: [
    DronePersistenceModule,
    TypeOrmModule.forFeature([Mission]),
    AuditModule,
    NotificationsModule,
    WorkspaceContextModule,
  ],
  controllers: [MissionsController],
  providers: [
    {
      provide: IMissionsRepository,
      useClass: TypeOrmMissionsRepository,
    },
    CreateMissionUseCase,
    ListMissionsUseCase,
    TransitionMissionUseCase,
    UpdateMissionUseCase,
    GetMissionUseCase,
  ],
  exports: [
    IMissionsRepository,
    CreateMissionUseCase,
    ListMissionsUseCase,
    TransitionMissionUseCase,
    UpdateMissionUseCase,
    GetMissionUseCase,
  ],
})
export class MissionsModule {}
