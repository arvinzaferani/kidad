import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1789473189781 implements MigrationInterface {
    name = 'Auto1789473189781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_expense_payers" DROP CONSTRAINT "FK_split_expense_payers_expense"`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" DROP CONSTRAINT "FK_split_expense_payers_member"`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" DROP CONSTRAINT "UQ_split_expense_payers_expense_member"`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" ADD CONSTRAINT "UQ_c9da627da3e3fe3ff826927a897" UNIQUE ("expenseId", "memberId")`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" ADD CONSTRAINT "FK_7934dca2c3a80b14eaeb3a7384a" FOREIGN KEY ("expenseId") REFERENCES "split_expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" ADD CONSTRAINT "FK_e5f7a31573c3465153eb1bd73d5" FOREIGN KEY ("memberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_expense_payers" DROP CONSTRAINT "FK_e5f7a31573c3465153eb1bd73d5"`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" DROP CONSTRAINT "FK_7934dca2c3a80b14eaeb3a7384a"`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" DROP CONSTRAINT "UQ_c9da627da3e3fe3ff826927a897"`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" ADD CONSTRAINT "UQ_split_expense_payers_expense_member" UNIQUE ("expenseId", "memberId")`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" ADD CONSTRAINT "FK_split_expense_payers_member" FOREIGN KEY ("memberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_payers" ADD CONSTRAINT "FK_split_expense_payers_expense" FOREIGN KEY ("expenseId") REFERENCES "split_expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
