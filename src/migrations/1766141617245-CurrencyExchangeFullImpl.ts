import { MigrationInterface, QueryRunner } from 'typeorm';

export class CurrencyExchangeFullImpl1766141617245
  implements MigrationInterface
{
  name = 'CurrencyExchangeFullImpl1766141617245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "sdkCurrency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "originalAmount" numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "appliedExchangeRate" numeric`,
    );
    await queryRunner.query(`ALTER TABLE "biddings" ADD "amountAll" numeric`);
    await queryRunner.query(
      `ALTER TABLE "biddings" ADD "currency" character varying`,
    );
    await queryRunner.query(`
    UPDATE "transactions"
    SET 
      "originalAmount" = "finalAmount",
      "appliedExchangeRate" = 1
    WHERE "originalAmount" IS NULL
  `);
    await queryRunner.query(`
    UPDATE "biddings"
    SET 
      "amountAll" = "amount",
      "currency" = 'ALL'
    WHERE "amountAll" IS NULL
  `);
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "originalAmount" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "appliedExchangeRate" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "biddings" ALTER COLUMN "amountAll" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "biddings" ALTER COLUMN "currency" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "paymentCurrency" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "finalAmount" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "finalAmount" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "paymentCurrency" SET DEFAULT 'ALL'`,
    );
    await queryRunner.query(`ALTER TABLE "biddings" DROP COLUMN "currency"`);
    await queryRunner.query(`ALTER TABLE "biddings" DROP COLUMN "amountAll"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "appliedExchangeRate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "originalAmount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "sdkCurrency" character varying`,
    );
  }
}
