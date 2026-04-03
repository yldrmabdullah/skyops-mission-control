import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1712188800000 implements MigrationInterface {
  name = 'InitialSchema1712188800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      CREATE TYPE "public"."drones_model_enum" AS ENUM(
        'PHANTOM_4',
        'MATRICE_300',
        'MAVIC_3_ENTERPRISE'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."drones_status_enum" AS ENUM(
        'AVAILABLE',
        'IN_MISSION',
        'MAINTENANCE',
        'RETIRED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."missions_type_enum" AS ENUM(
        'WIND_TURBINE_INSPECTION',
        'SOLAR_PANEL_SURVEY',
        'POWER_LINE_PATROL'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."missions_status_enum" AS ENUM(
        'PLANNED',
        'PRE_FLIGHT_CHECK',
        'IN_PROGRESS',
        'COMPLETED',
        'ABORTED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."maintenance_logs_type_enum" AS ENUM(
        'ROUTINE_CHECK',
        'BATTERY_REPLACEMENT',
        'MOTOR_REPAIR',
        'FIRMWARE_UPDATE',
        'FULL_OVERHAUL'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "drones" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "serialNumber" character varying(50) NOT NULL,
        "model" "public"."drones_model_enum" NOT NULL,
        "status" "public"."drones_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "totalFlightHours" numeric(8,1) NOT NULL DEFAULT '0',
        "flightHoursAtLastMaintenance" numeric(8,1) NOT NULL DEFAULT '0',
        "lastMaintenanceDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "nextMaintenanceDueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "registeredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_drones_serial_number" UNIQUE ("serialNumber"),
        CONSTRAINT "PK_drones_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "missions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "type" "public"."missions_type_enum" NOT NULL,
        "droneId" uuid NOT NULL,
        "pilotName" character varying(120) NOT NULL,
        "siteLocation" character varying(180) NOT NULL,
        "plannedStart" TIMESTAMP WITH TIME ZONE NOT NULL,
        "plannedEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
        "actualStart" TIMESTAMP WITH TIME ZONE,
        "actualEnd" TIMESTAMP WITH TIME ZONE,
        "status" "public"."missions_status_enum" NOT NULL DEFAULT 'PLANNED',
        "flightHoursLogged" numeric(6,1),
        "abortReason" character varying(500),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_missions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_missions_drone_id" FOREIGN KEY ("droneId") REFERENCES "drones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "maintenance_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "droneId" uuid NOT NULL,
        "type" "public"."maintenance_logs_type_enum" NOT NULL,
        "technicianName" character varying(120) NOT NULL,
        "notes" text,
        "performedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "flightHoursAtMaintenance" numeric(8,1) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maintenance_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_maintenance_logs_drone_id" FOREIGN KEY ("droneId") REFERENCES "drones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_missions_drone_time_window" ON "missions" ("droneId", "plannedStart", "plannedEnd")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_missions_status_planned_start" ON "missions" ("status", "plannedStart")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_maintenance_logs_drone_performed_at" ON "maintenance_logs" ("droneId", "performedAt")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "public"."IDX_maintenance_logs_drone_performed_at"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_missions_status_planned_start"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_missions_drone_time_window"',
    );
    await queryRunner.query('DROP TABLE "maintenance_logs"');
    await queryRunner.query('DROP TABLE "missions"');
    await queryRunner.query('DROP TABLE "drones"');
    await queryRunner.query('DROP TYPE "public"."maintenance_logs_type_enum"');
    await queryRunner.query('DROP TYPE "public"."missions_status_enum"');
    await queryRunner.query('DROP TYPE "public"."missions_type_enum"');
    await queryRunner.query('DROP TYPE "public"."drones_status_enum"');
    await queryRunner.query('DROP TYPE "public"."drones_model_enum"');
  }
}
