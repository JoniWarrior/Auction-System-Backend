import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTransactionStatusEnum1763634927490
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1️⃣ Rename old enum
    await queryRunner.query(`
            ALTER TYPE "public"."transactions_status_enum" 
            RENAME TO "transactions_status_enum_old"
        `);

    // 2️⃣ Create new enum including "processing" temporarily
    await queryRunner.query(`
            CREATE TYPE "public"."transactions_status_enum" AS ENUM(
                'success', 'fail', 'cancel', 'on hold', 'processing'
            )
        `);

    // 3️⃣ Change column type to new enum
    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "status" TYPE "public"."transactions_status_enum"
            USING "status"::text::"public"."transactions_status_enum"
    `);

    // 4️⃣ Update all "processing" values to "on hold"
    await queryRunner.query(`
      UPDATE "transactions"
      SET "status" = 'on hold'
      WHERE "status" = 'processing'
    `);

    // 5️⃣ Create final enum without "processing"
    await queryRunner.query(`
            CREATE TYPE "public"."transactions_status_enum_final" AS ENUM(
                'success', 'fail', 'cancel', 'on hold'
            )
        `);

    // 6️⃣ Switch column to final enum
    await queryRunner.query(`
            ALTER TABLE "transactions"
            ALTER COLUMN "status" TYPE "public"."transactions_status_enum_final"
            USING "status"::text::"public"."transactions_status_enum_final"
        `);

    // 7️⃣ Drop temporary enums
    await queryRunner.query(
      `DROP TYPE "public"."transactions_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);

    // 8️⃣ Rename final enum to original name
    await queryRunner.query(`
            ALTER TYPE "public"."transactions_status_enum_final"
            RENAME TO "transactions_status_enum"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optional: reverse steps if needed
  }
}
