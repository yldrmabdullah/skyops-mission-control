import { MigrationInterface, QueryRunner } from 'typeorm';

export class DroneOwnerScope1730100000000 implements MigrationInterface {
  name = 'DroneOwnerScope1730100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "drones" ADD "ownerId" uuid REFERENCES "users"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`
      UPDATE "drones" d
      SET "ownerId" = sub.id
      FROM (
        SELECT u.id FROM "users" u ORDER BY u."createdAt" ASC LIMIT 1
      ) AS sub
      WHERE d."ownerId" IS NULL
        AND EXISTS (SELECT 1 FROM "users" LIMIT 1)
    `);

    await queryRunner.query(`
      DELETE FROM "maintenance_logs"
      WHERE "droneId" IN (SELECT id FROM "drones" WHERE "ownerId" IS NULL)
    `);
    await queryRunner.query(`
      DELETE FROM "missions"
      WHERE "droneId" IN (SELECT id FROM "drones" WHERE "ownerId" IS NULL)
    `);
    await queryRunner.query(`DELETE FROM "drones" WHERE "ownerId" IS NULL`);

    await queryRunner.query(
      `ALTER TABLE "drones" ALTER COLUMN "ownerId" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "drones" DROP CONSTRAINT IF EXISTS "UQ_drones_serial_number"`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_drones_owner_serial" ON "drones" ("ownerId", "serialNumber")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_drones_owner_serial"`,
    );
    await queryRunner.query(
      `ALTER TABLE "drones" ADD CONSTRAINT "UQ_drones_serial_number" UNIQUE ("serialNumber")`,
    );
    await queryRunner.query(`ALTER TABLE "drones" DROP COLUMN "ownerId"`);
  }
}
