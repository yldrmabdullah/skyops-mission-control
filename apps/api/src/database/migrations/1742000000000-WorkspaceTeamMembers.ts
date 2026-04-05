import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceTeamMembers1742000000000 implements MigrationInterface {
  name = 'WorkspaceTeamMembers1742000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "workspaceOwnerId" uuid NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "mustChangePassword" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_workspace_owner"
      FOREIGN KEY ("workspaceOwnerId") REFERENCES "users"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_workspace_owner" ON "users" ("workspaceOwnerId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_workspace_owner"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_workspace_owner"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "mustChangePassword"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "workspaceOwnerId"`,
    );
  }
}
