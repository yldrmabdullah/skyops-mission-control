import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Defense in depth: no two *active* missions on the same drone may have overlapping
 * planned windows. Matches {@link ACTIVE_SCHEDULING_MISSION_STATUSES} in application code.
 * Complements pessimistic locking in create/update use cases.
 */
export class MissionActiveWindowExclusion1743000000000 implements MigrationInterface {
  name = 'MissionActiveWindowExclusion1743000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION mission_active_scheduling_range(
        status "public"."missions_status_enum",
        planned_start TIMESTAMP WITH TIME ZONE,
        planned_end TIMESTAMP WITH TIME ZONE
      ) RETURNS tstzrange
      LANGUAGE sql
      IMMUTABLE
      PARALLEL SAFE
      AS $fn$
        SELECT CASE
          WHEN status IN (
            'PLANNED'::"public"."missions_status_enum",
            'PRE_FLIGHT_CHECK'::"public"."missions_status_enum",
            'IN_PROGRESS'::"public"."missions_status_enum"
          )
          THEN tstzrange(planned_start, planned_end, '[]')
          ELSE NULL::tstzrange
        END;
      $fn$
    `);
    // Existing DBs (e.g. older seeds) may contain overlapping active windows; the EXCLUDE
    // constraint cannot be added until they are resolved. Abort the lexicographically
    // higher mission id in each overlapping pair until stable.
    await queryRunner.query(`
      DO $repair$
      DECLARE
        batch int;
      BEGIN
        LOOP
          UPDATE missions m2
          SET status = 'ABORTED'::"public"."missions_status_enum",
              "abortReason" = COALESCE(
                "abortReason",
                'Migration: resolved active-window overlap before EXCLUDE constraint'
              )
          FROM missions m1
          WHERE m1."droneId" = m2."droneId"
            AND m1.id < m2.id
            AND mission_active_scheduling_range(m1.status, m1."plannedStart", m1."plannedEnd")
              && mission_active_scheduling_range(m2.status, m2."plannedStart", m2."plannedEnd");
          GET DIAGNOSTICS batch = ROW_COUNT;
          EXIT WHEN batch = 0;
        END LOOP;
      END
      $repair$;
    `);
    await queryRunner.query(`
      ALTER TABLE "missions"
      ADD CONSTRAINT "EXCL_missions_drone_active_window"
      EXCLUDE USING gist (
        "droneId" WITH =,
        mission_active_scheduling_range(status, "plannedStart", "plannedEnd") WITH &&
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "missions" DROP CONSTRAINT IF EXISTS "EXCL_missions_drone_active_window"',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS mission_active_scheduling_range("public"."missions_status_enum", TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE)',
    );
  }
}
