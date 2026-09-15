import { MigrationInterface, QueryRunner } from "typeorm";

export class QuickSplit1789394471370 implements MigrationInterface {
    name = 'QuickSplit1789394471370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."split_sessions_status_enum" AS ENUM('ACTIVE', 'CLOSED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "split_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hostId" uuid NOT NULL, "inviteToken" character varying NOT NULL, "status" "public"."split_sessions_status_enum" NOT NULL DEFAULT 'ACTIVE', "title" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_split_sessions_invite_token" UNIQUE ("inviteToken"), CONSTRAINT "PK_split_sessions" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "split_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid NOT NULL, "userId" uuid NOT NULL, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_split_members_session_user" UNIQUE ("sessionId", "userId"), CONSTRAINT "PK_split_members" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."split_expenses_currency_enum" AS ENUM('TOMAN', 'RIAL')`);
        await queryRunner.query(`CREATE TYPE "public"."split_expenses_splittype_enum" AS ENUM('EQUAL', 'EXACT', 'PERCENT', 'SHARE')`);
        await queryRunner.query(`CREATE TABLE "split_expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid NOT NULL, "description" character varying NOT NULL, "amount" numeric(14,2) NOT NULL, "currency" "public"."split_expenses_currency_enum" NOT NULL DEFAULT 'TOMAN', "splitType" "public"."split_expenses_splittype_enum" NOT NULL DEFAULT 'EQUAL', "addedByMemberId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_split_expenses" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "split_expense_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expenseId" uuid NOT NULL, "memberId" uuid NOT NULL, "value" numeric(14,2) NOT NULL, CONSTRAINT "UQ_split_expense_participants_expense_member" UNIQUE ("expenseId", "memberId"), CONSTRAINT "PK_split_expense_participants" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "split_sessions" ADD CONSTRAINT "FK_split_sessions_host" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_members" ADD CONSTRAINT "FK_split_members_session" FOREIGN KEY ("sessionId") REFERENCES "split_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_members" ADD CONSTRAINT "FK_split_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expenses" ADD CONSTRAINT "FK_split_expenses_session" FOREIGN KEY ("sessionId") REFERENCES "split_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expenses" ADD CONSTRAINT "FK_split_expenses_added_by" FOREIGN KEY ("addedByMemberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" ADD CONSTRAINT "FK_split_expense_participants_expense" FOREIGN KEY ("expenseId") REFERENCES "split_expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" ADD CONSTRAINT "FK_split_expense_participants_member" FOREIGN KEY ("memberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_expense_participants" DROP CONSTRAINT "FK_split_expense_participants_member"`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" DROP CONSTRAINT "FK_split_expense_participants_expense"`);
        await queryRunner.query(`ALTER TABLE "split_expenses" DROP CONSTRAINT "FK_split_expenses_added_by"`);
        await queryRunner.query(`ALTER TABLE "split_expenses" DROP CONSTRAINT "FK_split_expenses_session"`);
        await queryRunner.query(`ALTER TABLE "split_members" DROP CONSTRAINT "FK_split_members_user"`);
        await queryRunner.query(`ALTER TABLE "split_members" DROP CONSTRAINT "FK_split_members_session"`);
        await queryRunner.query(`ALTER TABLE "split_sessions" DROP CONSTRAINT "FK_split_sessions_host"`);
        await queryRunner.query(`DROP TABLE "split_expense_participants"`);
        await queryRunner.query(`DROP TABLE "split_expenses"`);
        await queryRunner.query(`DROP TABLE "split_members"`);
        await queryRunner.query(`DROP TABLE "split_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."split_expenses_splittype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."split_expenses_currency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."split_sessions_status_enum"`);
    }
}