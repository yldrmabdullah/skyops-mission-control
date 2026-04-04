import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPort,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsPort()
  PORT?: string;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  /** Used with discrete vars when `DATABASE_URL` is unset (e.g. local Docker). */
  @IsOptional()
  @IsString()
  DATABASE_HOST?: string;

  @IsOptional()
  @IsInt()
  DATABASE_PORT?: number;

  @IsOptional()
  @IsString()
  DATABASE_USERNAME?: string;

  @IsOptional()
  @IsString()
  DATABASE_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DATABASE_NAME?: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (!validatedConfig.DATABASE_URL) {
    const requiredFields = [
      'DATABASE_HOST',
      'DATABASE_PORT',
      'DATABASE_USERNAME',
      'DATABASE_PASSWORD',
      'DATABASE_NAME',
    ] as const;
    const missingFields = requiredFields.filter(
      (field) => !validatedConfig[field],
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required database configuration: ${missingFields.join(', ')}.`,
      );
    }
  }

  return validatedConfig;
}
