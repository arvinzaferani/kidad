import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1780238388578 implements MigrationInterface {
    name = 'Auto1780238388578'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "expense_payers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expenseId" uuid NOT NULL, "userId" uuid, "groupMemberId" uuid NOT NULL, "amount" numeric(14,2) NOT NULL, CONSTRAINT "PK_525982bdd24d079bb119776db9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expense_splits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expenseId" uuid NOT NULL, "userId" uuid, "groupMemberId" uuid NOT NULL, "value" numeric(14,2) NOT NULL, CONSTRAINT "PK_67774a6f95e6b4acf7a5ce861b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."expenses_currency_enum" AS ENUM('TOMAN', 'RIAL')`);
        await queryRunner.query(`CREATE TYPE "public"."expenses_splittype_enum" AS ENUM('EQUAL', 'EXACT', 'PERCENT', 'SHARE')`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groupId" uuid NOT NULL, "description" character varying NOT NULL, "amount" numeric(14,2) NOT NULL, "currency" "public"."expenses_currency_enum" NOT NULL, "splitType" "public"."expenses_splittype_enum" NOT NULL, "date" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."settlements_method_enum" AS ENUM('CASH', 'CARD', 'BANK', 'MANUAL')`);
        await queryRunner.query(`CREATE TYPE "public"."settlements_status_enum" AS ENUM('PENDING', 'SETTLED')`);
        await queryRunner.query(`CREATE TABLE "settlements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groupId" uuid NOT NULL, "payerId" uuid, "receiverId" uuid, "payerMemberId" uuid NOT NULL, "receiverMemberId" uuid NOT NULL, "amount" numeric(14,2) NOT NULL, "method" "public"."settlements_method_enum" NOT NULL, "status" "public"."settlements_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5f523ce152b84e818bff9467aab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."groups_currency_enum" AS ENUM('TOMAN', 'RIAL')`);
        await queryRunner.query(`CREATE TYPE "public"."groups_membermode_enum" AS ENUM('STANDARD', 'CREATOR_MANAGED')`);
        await queryRunner.query(`CREATE TABLE "groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "currency" "public"."groups_currency_enum" NOT NULL DEFAULT 'TOMAN', "description" character varying, "imageUrl" character varying, "memberMode" "public"."groups_membermode_enum" NOT NULL DEFAULT 'STANDARD', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "groupId" uuid NOT NULL, "isAdmin" boolean NOT NULL DEFAULT false, "guestName" character varying, "guestEmail" character varying, "guestPhone" character varying, CONSTRAINT "UQ_53f644f66a416c1542b743c0295" UNIQUE ("userId", "groupId"), CONSTRAINT "PK_86446139b2c96bfd0f3b8638852" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying, "email" character varying, "isEmailVerified" boolean NOT NULL DEFAULT true, "isAdmin" boolean NOT NULL DEFAULT false, "isBanned" boolean NOT NULL DEFAULT false, "passwordHash" character varying NOT NULL, "nickname" character varying NOT NULL, "avatarUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."group_invitations_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED')`);
        await queryRunner.query(`CREATE TABLE "group_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "groupId" uuid NOT NULL, "inviterId" uuid NOT NULL, "inviteeId" uuid NOT NULL, "status" "public"."group_invitations_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f7d0b290d6079ae9353d794227d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."inbox_messages_type_enum" AS ENUM('INVITE_CREATED', 'INVITE_ACCEPTED', 'INVITE_DECLINED', 'SETTLEMENT_CREATED', 'PAYMENT_SETTLED', 'FRIEND_REQUEST_CREATED', 'FRIEND_REQUEST_ACCEPTED', 'FRIEND_REQUEST_DECLINED', 'FRIEND_ADDED_TO_GROUP')`);
        await queryRunner.query(`CREATE TABLE "inbox_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "groupId" uuid, "type" "public"."inbox_messages_type_enum" NOT NULL, "message" character varying NOT NULL, "meta" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f12cf14472c0a9d19bb57cc8478" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."friend_requests_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED')`);
        await queryRunner.query(`CREATE TABLE "friend_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requesterId" uuid NOT NULL, "addresseeId" uuid NOT NULL, "status" "public"."friend_requests_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5f7ea718f1f01b223a32b195605" UNIQUE ("requesterId", "addresseeId"), CONSTRAINT "PK_3827ba86ce64ecb4b90c92eeea6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "email_verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_10f285d038feb767bf7c2da14b" ON "email_verification_tokens" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_90489f8f3368c45f461e90efbe" ON "email_verification_tokens" ("tokenHash") `);
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d6a19d4b4f6c62dcd29daa497e" ON "password_reset_tokens" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1143abb8c3fad8b06dd857a8c9" ON "password_reset_tokens" ("tokenHash") `);
        await queryRunner.query(`CREATE TABLE "email_login_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_240dc01d638d8805de002f8ed58" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5f592d06145bc44ed4d5508de4" ON "email_login_tokens" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_054894ed8c9809d06d0127b8b3" ON "email_login_tokens" ("tokenHash") `);
        await queryRunner.query(`ALTER TABLE "expense_payers" ADD CONSTRAINT "FK_56701319938b9888278813e7405" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_payers" ADD CONSTRAINT "FK_041102fc53c74b03c05e64295b8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_payers" ADD CONSTRAINT "FK_88f3749e3557b3885da541d4ccc" FOREIGN KEY ("groupMemberId") REFERENCES "group_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_splits" ADD CONSTRAINT "FK_b95401b116d51927deee62ccfeb" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_splits" ADD CONSTRAINT "FK_8b3ce1352fae50d1648c39e56ca" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expense_splits" ADD CONSTRAINT "FK_bc8d0d6a0b0b11a44b33b8785f3" FOREIGN KEY ("groupMemberId") REFERENCES "group_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_c4601c36c8b1326e9427e1aca3b" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_6de51718df9c536adfa37e6f9ef" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_34e03f153a2ecfd035ab3417c41" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_354392976ee8faff83e73d6fad1" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_d065906237bcb367b6911aa9fc0" FOREIGN KEY ("payerMemberId") REFERENCES "group_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_d642783a0ace4a2281a0ef1a83c" FOREIGN KEY ("receiverMemberId") REFERENCES "group_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_fdef099303bcf0ffd9a4a7b18f5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_1aa8d31831c3126947e7a713c2b" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_ab934a07e81281d8da148ee641b" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_a438159887b5dc753002686a28e" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_invitations" ADD CONSTRAINT "FK_afbc615e42e2a3269766f5e352b" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbox_messages" ADD CONSTRAINT "FK_22e8a830a2c3a7fb57fe64e5506" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inbox_messages" ADD CONSTRAINT "FK_b87bd99a1f7e7e79cb0c47e1f05" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_0a91c26699cf7e177f9c5b5beb4" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_9efe67143c1ae817f0cc3bdd703" FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_10f285d038feb767bf7c2da14b3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_login_tokens" ADD CONSTRAINT "FK_5f592d06145bc44ed4d5508de45" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_login_tokens" DROP CONSTRAINT "FK_5f592d06145bc44ed4d5508de45"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2"`);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_10f285d038feb767bf7c2da14b3"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_9efe67143c1ae817f0cc3bdd703"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_0a91c26699cf7e177f9c5b5beb4"`);
        await queryRunner.query(`ALTER TABLE "inbox_messages" DROP CONSTRAINT "FK_b87bd99a1f7e7e79cb0c47e1f05"`);
        await queryRunner.query(`ALTER TABLE "inbox_messages" DROP CONSTRAINT "FK_22e8a830a2c3a7fb57fe64e5506"`);
        await queryRunner.query(`ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_afbc615e42e2a3269766f5e352b"`);
        await queryRunner.query(`ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_a438159887b5dc753002686a28e"`);
        await queryRunner.query(`ALTER TABLE "group_invitations" DROP CONSTRAINT "FK_ab934a07e81281d8da148ee641b"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_1aa8d31831c3126947e7a713c2b"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_fdef099303bcf0ffd9a4a7b18f5"`);
        await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_d642783a0ace4a2281a0ef1a83c"`);
        await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_d065906237bcb367b6911aa9fc0"`);
        await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_354392976ee8faff83e73d6fad1"`);
        await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_34e03f153a2ecfd035ab3417c41"`);
        await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_6de51718df9c536adfa37e6f9ef"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_c4601c36c8b1326e9427e1aca3b"`);
        await queryRunner.query(`ALTER TABLE "expense_splits" DROP CONSTRAINT "FK_bc8d0d6a0b0b11a44b33b8785f3"`);
        await queryRunner.query(`ALTER TABLE "expense_splits" DROP CONSTRAINT "FK_8b3ce1352fae50d1648c39e56ca"`);
        await queryRunner.query(`ALTER TABLE "expense_splits" DROP CONSTRAINT "FK_b95401b116d51927deee62ccfeb"`);
        await queryRunner.query(`ALTER TABLE "expense_payers" DROP CONSTRAINT "FK_88f3749e3557b3885da541d4ccc"`);
        await queryRunner.query(`ALTER TABLE "expense_payers" DROP CONSTRAINT "FK_041102fc53c74b03c05e64295b8"`);
        await queryRunner.query(`ALTER TABLE "expense_payers" DROP CONSTRAINT "FK_56701319938b9888278813e7405"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_054894ed8c9809d06d0127b8b3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f592d06145bc44ed4d5508de4"`);
        await queryRunner.query(`DROP TABLE "email_login_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1143abb8c3fad8b06dd857a8c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6a19d4b4f6c62dcd29daa497e"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_90489f8f3368c45f461e90efbe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10f285d038feb767bf7c2da14b"`);
        await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
        await queryRunner.query(`DROP TABLE "friend_requests"`);
        await queryRunner.query(`DROP TYPE "public"."friend_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "inbox_messages"`);
        await queryRunner.query(`DROP TYPE "public"."inbox_messages_type_enum"`);
        await queryRunner.query(`DROP TABLE "group_invitations"`);
        await queryRunner.query(`DROP TYPE "public"."group_invitations_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "group_members"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`DROP TYPE "public"."groups_membermode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."groups_currency_enum"`);
        await queryRunner.query(`DROP TABLE "settlements"`);
        await queryRunner.query(`DROP TYPE "public"."settlements_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."settlements_method_enum"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TYPE "public"."expenses_splittype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."expenses_currency_enum"`);
        await queryRunner.query(`DROP TABLE "expense_splits"`);
        await queryRunner.query(`DROP TABLE "expense_payers"`);
    }

}
