import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchemaAndAuth1700000000000 implements MigrationInterface {
  name = 'InitSchemaAndAuth1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`CREATE TYPE "public"."currency_enum" AS ENUM('TOMAN', 'RIAL')`);
    await queryRunner.query(`CREATE TYPE "public"."expenses_splittype_enum" AS ENUM('EQUAL', 'EXACT', 'PERCENT', 'SHARE')`);
    await queryRunner.query(`CREATE TYPE "public"."settlements_method_enum" AS ENUM('CASH', 'CARD', 'BANK', 'MANUAL')`);
    await queryRunner.query(`CREATE TYPE "public"."settlements_status_enum" AS ENUM('PENDING', 'SETTLED')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone" character varying,
        "email" character varying,
        "passwordHash" character varying NOT NULL,
        "nickname" character varying NOT NULL,
        "avatarUrl" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_contact" CHECK ("phone" IS NOT NULL OR "email" IS NOT NULL)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "groups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "currency" "public"."currency_enum" NOT NULL DEFAULT 'TOMAN',
        "description" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_groups_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "group_members" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "groupId" uuid NOT NULL,
        "isAdmin" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_group_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_group_members_user_group" UNIQUE ("userId", "groupId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "expenses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "groupId" uuid NOT NULL,
        "description" character varying NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "currency" "public"."currency_enum" NOT NULL,
        "splitType" "public"."expenses_splittype_enum" NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_expenses_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "expense_payers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "expenseId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        CONSTRAINT "PK_expense_payers_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "expense_splits" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "expenseId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "value" numeric(14,2) NOT NULL,
        CONSTRAINT "PK_expense_splits_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "settlements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "groupId" uuid NOT NULL,
        "payerId" uuid NOT NULL,
        "receiverId" uuid NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "method" "public"."settlements_method_enum" NOT NULL,
        "status" "public"."settlements_status_enum" NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_settlements_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_group_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_group_members_group" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_expenses_group" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "expense_payers" ADD CONSTRAINT "FK_expense_payers_expense" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "expense_payers" ADD CONSTRAINT "FK_expense_payers_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "expense_splits" ADD CONSTRAINT "FK_expense_splits_expense" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "expense_splits" ADD CONSTRAINT "FK_expense_splits_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_settlements_group" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_settlements_payer" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "settlements" ADD CONSTRAINT "FK_settlements_receiver" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_settlements_receiver"`);
    await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_settlements_payer"`);
    await queryRunner.query(`ALTER TABLE "settlements" DROP CONSTRAINT "FK_settlements_group"`);

    await queryRunner.query(`ALTER TABLE "expense_splits" DROP CONSTRAINT "FK_expense_splits_user"`);
    await queryRunner.query(`ALTER TABLE "expense_splits" DROP CONSTRAINT "FK_expense_splits_expense"`);
    await queryRunner.query(`ALTER TABLE "expense_payers" DROP CONSTRAINT "FK_expense_payers_user"`);
    await queryRunner.query(`ALTER TABLE "expense_payers" DROP CONSTRAINT "FK_expense_payers_expense"`);
    await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_group"`);

    await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_group_members_group"`);
    await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_group_members_user"`);

    await queryRunner.query(`DROP TABLE "settlements"`);
    await queryRunner.query(`DROP TABLE "expense_splits"`);
    await queryRunner.query(`DROP TABLE "expense_payers"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "group_members"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "public"."settlements_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."settlements_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."expenses_splittype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."currency_enum"`);
  }
}
