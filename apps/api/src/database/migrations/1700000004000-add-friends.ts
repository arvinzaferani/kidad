import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFriends1700000004000 implements MigrationInterface {
  name = 'AddFriends1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."inbox_messages_type_enum" ADD VALUE IF NOT EXISTS 'FRIEND_REQUEST_CREATED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."inbox_messages_type_enum" ADD VALUE IF NOT EXISTS 'FRIEND_REQUEST_ACCEPTED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."inbox_messages_type_enum" ADD VALUE IF NOT EXISTS 'FRIEND_REQUEST_DECLINED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."inbox_messages_type_enum" ADD VALUE IF NOT EXISTS 'FRIEND_ADDED_TO_GROUP'`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."friend_requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "friend_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "requesterId" uuid NOT NULL,
        "addresseeId" uuid NOT NULL,
        "status" "public"."friend_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_friend_requests_users" UNIQUE ("requesterId", "addresseeId"),
        CONSTRAINT "PK_friend_requests_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_friend_requests_addressee_status" ON "friend_requests" ("addresseeId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_friend_requests_requester_status" ON "friend_requests" ("requesterId", "status")`,
    );

    await queryRunner.query(
      `ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_friend_requests_requester" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_friend_requests_addressee" FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_friend_requests_addressee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_friend_requests_requester"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_friend_requests_requester_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_friend_requests_addressee_status"`);
    await queryRunner.query(`DROP TABLE "friend_requests"`);
    await queryRunner.query(`DROP TYPE "public"."friend_requests_status_enum"`);
  }
}
