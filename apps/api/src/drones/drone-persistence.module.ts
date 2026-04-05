import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone } from './entities/drone.entity';
import { IDronesRepository } from './repositories/drones.repository.interface';
import { TypeOrmDronesRepository } from './repositories/typeorm-drones.repository';

/** Drone entity + IDronesRepository for missions/maintenance without importing DronesModule. */
@Module({
  imports: [TypeOrmModule.forFeature([Drone])],
  providers: [
    {
      provide: IDronesRepository,
      useClass: TypeOrmDronesRepository,
    },
  ],
  exports: [TypeOrmModule, IDronesRepository],
})
export class DronePersistenceModule {}
