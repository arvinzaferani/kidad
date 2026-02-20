import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitationsAndInbox1700000001000 implements MigrationInterface {
  name = 'AddInvitationsAndInbox1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."group_invitations_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED')`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."inbox_messages_type_enum" AS ENUM('INVITE_CREATED', 'INVITE_ACCEPTED', 'INVITE_DECLINED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "group_invitations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "groupId" uuid NOT NULL,
        "inviterId" uuid NOT NULL,
        "inviteeId" uuid NOT NULL,
        "status" "public"."group_invitations_status_enum" NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_group_invitations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "inbox_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "groupId" uuid,
        "type" "public"."inbox_messages_type_enum" NOT NULL,
        "message" character varying NOT NULL,
        "meta" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inbox_messages_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_group_invitations_group_status" ON "group_invitations" ("groupId", "status")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_group_invitations_invitee_status" ON "group_invitations" ("inviteeId", "status")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_inbox_messages_user_created" ON "inbox_messages" ("userId", "createdAt")`,
    );

    await queryRunner.query(
      `ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_group_invitations_group" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_group_invitations_inviter" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_group_invitations_invitee" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "inbox_messages" ADD CONSTRAINT "FK_inbox_messages_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "inbox_messages" ADD CONSTRAINT "FK_inbox_messages_group" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inbox_messages" DROP CONSTRAINT "FK_inbox_messages_group"`,
    );

    await queryRunner.query(
      `ALTER TABLE "inbox_messages" DROP CONSTRAINT "FK_inbox_messages_user"`,
    );

    await queryRunner.query(
      `ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_group_invitations_invitee"`,
    );

    await queryRunner.query(
      `ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_group_invitations_inviter"`,
    );

    await queryRunner.query(
      `ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_group_invitations_group"`,
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_inbox_messages_user_created"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_group_invitations_invitee_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_group_invitations_group_status"`);

    await queryRunner.query(`DROP TABLE "inbox_messages"`);
    await queryRunner.query(`DROP TABLE "group_invitations"`);

    await queryRunner.query(`DROP TYPE "public"."inbox_messages_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."group_invitations_status_enum"`);
  }
}
