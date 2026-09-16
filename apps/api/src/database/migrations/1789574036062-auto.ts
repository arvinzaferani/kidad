import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1789574036062 implements MigrationInterface {
    name = 'Auto1789574036062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "card_number" character varying(16)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "shaba" character varying(26)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "shaba"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "card_number"`);
    }

}
