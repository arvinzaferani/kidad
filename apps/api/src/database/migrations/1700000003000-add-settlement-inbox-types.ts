import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettlementInboxTypes1700000003000 implements MigrationInterface {
  name = 'AddSettlementInboxTypes1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."inbox_messages_type_enum" ADD VALUE IF NOT EXISTS 'SETTLEMENT_CREATED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."inbox_messages_type_enum" ADD VALUE IF NOT EXISTS 'PAYMENT_SETTLED'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres enum value removal is not safely reversible in-place.
  }
}
