import { MigrationInterface, QueryRunner } from "typeorm";

export class QuickSplitPayers1789470045406 implements MigrationInterface {
    name = 'QuickSplitPayers1789470045406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "split_expense_payers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expenseId" uuid NOT NULL, "memberId" uuid NOT NULL, "amount" numeric(14,2) NOT NULL, CONSTRAINT "UQ_split_expense_payers_expense_member" UNIQUE ("expenseId", "memberId"), CONSTRAINT "PK_split_expense_payers" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" ADD CONSTRAINT "FK_split_expense_payers_expense" FOREIGN KEY ("expenseId") REFERENCES "split_expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" ADD CONSTRAINT "FK_split_expense_payers_member" FOREIGN KEY ("memberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_expense_payers" DROP CONSTRAINT "FK_split_expense_payers_member"`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" DROP CONSTRAINT "FK_split_expense_payers_expense"`);
        await queryRunner.query(`DROP TABLE "split_expense_payers"`);
    }
}