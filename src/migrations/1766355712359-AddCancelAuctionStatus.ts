import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancelAuctionStatus1766355712359 implements MigrationInterface {
    name = 'AddCancelAuctionStatus1766355712359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_eec682e1e2b3c3d8ebaec7f2b5"`);
        await queryRunner.query(`ALTER TYPE "public"."auctions_status_enum" RENAME TO "auctions_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."auctions_status_enum" AS ENUM('active', 'pending', 'finished', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "status" TYPE "public"."auctions_status_enum" USING "status"::"text"::"public"."auctions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."auctions_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_eec682e1e2b3c3d8ebaec7f2b5" ON "auctions" ("status", "endTime") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_eec682e1e2b3c3d8ebaec7f2b5"`);
        await queryRunner.query(`CREATE TYPE "public"."auctions_status_enum_old" AS ENUM('pending', 'active', 'finished')`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "status" TYPE "public"."auctions_status_enum_old" USING "status"::"text"::"public"."auctions_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."auctions_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."auctions_status_enum_old" RENAME TO "auctions_status_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_eec682e1e2b3c3d8ebaec7f2b5" ON "auctions" ("endTime", "status") `);
    }

}
