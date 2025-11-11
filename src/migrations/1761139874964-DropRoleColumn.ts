import { MigrationInterface, QueryRunner } from "typeorm";

export class DropRoleColumn1761139874964 implements MigrationInterface {
  name = 'DropRoleColumn1761139874964';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the role column if it exists
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN IF EXISTS "role";
    `);

    // Drop enum type if it still exists
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."user_role_enum";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the enum and column if you ever revert this migration
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM ('bidder', 'seller', 'admin');
    `);

    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "role" "public"."user_role_enum" DEFAULT 'bidder';
    `);
  }
}
