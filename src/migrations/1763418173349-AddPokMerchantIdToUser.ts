import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPokMerchantIdToUser1689654321000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "pokMerchantId" character varying`,
    );

    await queryRunner.query(
      `UPDATE "user" SET "pokMerchantId" = gen_random_uuid()::text WHERE "pokMerchantId" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "pokMerchantId" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_pokMerchantId" UNIQUE ("pokMerchantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_pokMerchantId"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "pokMerchantId"`);
  }
}
