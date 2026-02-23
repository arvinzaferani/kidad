import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetAndEmailLoginTokens1700000006000
  implements MigrationInterface
{
  name = 'AddPasswordResetAndEmailLoginTokens1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_login_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_login_tokens_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_userId" ON "password_reset_tokens" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_tokenHash" ON "password_reset_tokens" ("tokenHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_email_login_tokens_userId" ON "email_login_tokens" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_email_login_tokens_tokenHash" ON "email_login_tokens" ("tokenHash")`,
    );

    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_login_tokens" ADD CONSTRAINT "FK_email_login_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_login_tokens" DROP CONSTRAINT IF EXISTS "FK_email_login_tokens_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT IF EXISTS "FK_password_reset_tokens_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_email_login_tokens_tokenHash"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_email_login_tokens_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_password_reset_tokens_tokenHash"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_password_reset_tokens_userId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "email_login_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
  }
}
