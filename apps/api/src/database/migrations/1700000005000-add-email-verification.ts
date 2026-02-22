import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1700000005000 implements MigrationInterface {
  name = 'AddEmailVerification1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isEmailVerified" boolean NOT NULL DEFAULT true`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_verification_tokens_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_email_verification_tokens_userId" ON "email_verification_tokens" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_email_verification_tokens_tokenHash" ON "email_verification_tokens" ("tokenHash")`,
    );

    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_email_verification_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" DROP CONSTRAINT IF EXISTS "FK_email_verification_tokens_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_email_verification_tokens_tokenHash"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_email_verification_tokens_userId"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "email_verification_tokens"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "isEmailVerified"`,
    );
  }
}
