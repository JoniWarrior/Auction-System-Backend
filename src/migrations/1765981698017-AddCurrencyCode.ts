import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyCode1765981698017 implements MigrationInterface {
  name = 'AddCurrencyCode1765981698017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "paymentCurrency" character varying NOT NULL DEFAULT 'ALL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "sdkCurrency" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "finalAmount" numeric NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "finalAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "sdkCurrency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "paymentCurrency"`,
    );
  }
}
