import { MigrationInterface, QueryRunner } from 'typeorm';

export class OperatorWorkspaceEnhancements1741000000000 implements MigrationInterface {
  name = 'OperatorWorkspaceEnhancements1741000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "role" character varying(20) NOT NULL DEFAULT 'PILOT'
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "notificationPreferences" jsonb NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "maintenance_logs"
      ADD "attachments" jsonb NOT NULL DEFAULT '[]'
    `);
    await queryRunner.query(`
      CREATE TABLE "audit_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "actorUserId" uuid NOT NULL,
        "action" character varying(80) NOT NULL,
        "entityType" character varying(80) NOT NULL,
        "entityId" uuid NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_events_actor" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "in_app_notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "body" text NOT NULL,
        "readAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_in_app_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_in_app_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_events_actor" ON "audit_events" ("actorUserId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_in_app_notifications_user" ON "in_app_notifications" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_in_app_notifications_user"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_events_actor"`);
    await queryRunner.query(`DROP TABLE "in_app_notifications"`);
    await queryRunner.query(`DROP TABLE "audit_events"`);
    await queryRunner.query(
      `ALTER TABLE "maintenance_logs" DROP COLUMN "attachments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "notificationPreferences"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
  }
}
