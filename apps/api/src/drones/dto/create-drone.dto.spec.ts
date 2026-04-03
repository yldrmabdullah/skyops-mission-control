import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DroneModel } from '../entities/drone.entity';
import { CreateDroneDto } from './create-drone.dto';

describe('CreateDroneDto', () => {
  it('accepts a valid serial number format', async () => {
    const dto = plainToInstance(CreateDroneDto, {
      serialNumber: 'SKY-A1B2-C3D4',
      model: DroneModel.MATRICE_300,
      lastMaintenanceDate: '2026-04-01T00:00:00.000Z',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid serial number format', async () => {
    const dto = plainToInstance(CreateDroneDto, {
      serialNumber: 'INVALID-1234',
      model: DroneModel.MATRICE_300,
      lastMaintenanceDate: '2026-04-01T00:00:00.000Z',
    });

    const errors = await validate(dto);

    expect(errors).not.toHaveLength(0);
    expect(errors[0]?.constraints).toHaveProperty('matches');
  });
});
