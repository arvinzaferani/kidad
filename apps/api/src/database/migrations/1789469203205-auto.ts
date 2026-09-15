import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1789469203205 implements MigrationInterface {
    name = 'Auto1789469203205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_members" DROP CONSTRAINT "FK_split_members_session"`);
        await queryRunner.query(`ALTER TABLE "split_members" DROP CONSTRAINT "FK_split_members_user"`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" DROP CONSTRAINT "FK_split_expense_participants_expense"`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" DROP CONSTRAINT "FK_split_expense_participants_member"`);
        await queryRunner.query(`ALTER TABLE "split_expenses" DROP CONSTRAINT "FK_split_expenses_session"`);
        await queryRunner.query(`ALTER TABLE "split_expenses" DROP CONSTRAINT "FK_split_expenses_added_by"`);
        await queryRunner.query(`ALTER TABLE "split_sessions" DROP CONSTRAINT "FK_split_sessions_host"`);
        await queryRunner.query(`ALTER TABLE "split_members" DROP CONSTRAINT "UQ_split_members_session_user"`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" DROP CONSTRAINT "UQ_split_expense_participants_expense_member"`);
        await queryRunner.query(`ALTER TABLE "split_members" ADD CONSTRAINT "UQ_2cddacab167ce724b008cd55eec" UNIQUE ("sessionId", "userId")`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" ADD CONSTRAINT "UQ_5dab432973f22623cb39b6b0c46" UNIQUE ("expenseId", "memberId")`);
        await queryRunner.query(`ALTER TABLE "split_members" ADD CONSTRAINT "FK_4c12bed949c5464501673f23cfb" FOREIGN KEY ("sessionId") REFERENCES "split_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_members" ADD CONSTRAINT "FK_49bfc470a1c2678bd8154131650" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" ADD CONSTRAINT "FK_71981bb536bb2512c64dcd9427b" FOREIGN KEY ("expenseId") REFERENCES "split_expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" ADD CONSTRAINT "FK_0ac33ccbf7bb107699bf52a7214" FOREIGN KEY ("memberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expenses" ADD CONSTRAINT "FK_5eb0eb55a8a66ca517557767fd8" FOREIGN KEY ("sessionId") REFERENCES "split_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expenses" ADD CONSTRAINT "FK_3b1f78b3797b6f4ed34b959a002" FOREIGN KEY ("addedByMemberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_sessions" ADD CONSTRAINT "FK_64c777ad2a492d83edfc7f549c6" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_sessions" DROP CONSTRAINT "FK_64c777ad2a492d83edfc7f549c6"`);
        await queryRunner.query(`ALTER TABLE "split_expenses" DROP CONSTRAINT "FK_3b1f78b3797b6f4ed34b959a002"`);
        await queryRunner.query(`ALTER TABLE "split_expenses" DROP CONSTRAINT "FK_5eb0eb55a8a66ca517557767fd8"`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" DROP CONSTRAINT "FK_0ac33ccbf7bb107699bf52a7214"`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" DROP CONSTRAINT "FK_71981bb536bb2512c64dcd9427b"`);
        await queryRunner.query(`ALTER TABLE "split_members" DROP CONSTRAINT "FK_49bfc470a1c2678bd8154131650"`);
        await queryRunner.query(`ALTER TABLE "split_members" DROP CONSTRAINT "FK_4c12bed949c5464501673f23cfb"`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" DROP CONSTRAINT "UQ_5dab432973f22623cb39b6b0c46"`);
        await queryRunner.query(`ALTER TABLE "split_members" DROP CONSTRAINT "UQ_2cddacab167ce724b008cd55eec"`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" ADD CONSTRAINT "UQ_split_expense_participants_expense_member" UNIQUE ("expenseId", "memberId")`);
        await queryRunner.query(`ALTER TABLE "split_members" ADD CONSTRAINT "UQ_split_members_session_user" UNIQUE ("sessionId", "userId")`);
        await queryRunner.query(`ALTER TABLE "split_sessions" ADD CONSTRAINT "FK_split_sessions_host" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expenses" ADD CONSTRAINT "FK_split_expenses_added_by" FOREIGN KEY ("addedByMemberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expenses" ADD CONSTRAINT "FK_split_expenses_session" FOREIGN KEY ("sessionId") REFERENCES "split_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" ADD CONSTRAINT "FK_split_expense_participants_member" FOREIGN KEY ("memberId") REFERENCES "split_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_expense_participants" ADD CONSTRAINT "FK_split_expense_participants_expense" FOREIGN KEY ("expenseId") REFERENCES "split_expenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_members" ADD CONSTRAINT "FK_split_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_members" ADD CONSTRAINT "FK_split_members_session" FOREIGN KEY ("sessionId") REFERENCES "split_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
