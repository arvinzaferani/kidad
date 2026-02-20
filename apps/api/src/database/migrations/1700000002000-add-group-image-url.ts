import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupImageUrl1700000002000 implements MigrationInterface {
  name = 'AddGroupImageUrl1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "imageUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "groups" DROP COLUMN IF EXISTS "imageUrl"`,
    );
  }
}
