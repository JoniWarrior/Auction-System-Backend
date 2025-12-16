import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTransactionStatusEnum1763634927490
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."transactions_status_enum" 
            RENAME TO "transactions_status_enum_old"
        `);

    await queryRunner.query(`
            CREATE TYPE "public"."transactions_status_enum" AS ENUM(
                'success', 'fail', 'cancel', 'on hold', 'processing'
            )
        `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "status" TYPE "public"."transactions_status_enum"
            USING "status"::text::"public"."transactions_status_enum"
    `);

    await queryRunner.query(`
      UPDATE "transactions"
      SET "status" = 'on hold'
      WHERE "status" = 'processing'
    `);

    await queryRunner.query(`
            CREATE TYPE "public"."transactions_status_enum_final" AS ENUM(
                'success', 'fail', 'cancel', 'on hold'
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "transactions"
            ALTER COLUMN "status" TYPE "public"."transactions_status_enum_final"
            USING "status"::text::"public"."transactions_status_enum_final"
        `);

    await queryRunner.query(
      `DROP TYPE "public"."transactions_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);

    await queryRunner.query(`
            ALTER TYPE "public"."transactions_status_enum_final"
            RENAME TO "transactions_status_enum"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
