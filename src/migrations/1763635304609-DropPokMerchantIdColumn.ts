import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPokMerchantIdFromUser1689654321001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint first
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "UQ_pokMerchantId"`,
    );

    // Drop the column
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "pokMerchantId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optional: recreate the column and constraint (not needed if you only want to drop)
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
}
