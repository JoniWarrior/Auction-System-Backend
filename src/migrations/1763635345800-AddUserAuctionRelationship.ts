import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAuctionRelationship1763635345800
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "auctions" ADD "ownerId" uuid`);

    await queryRunner.query(`
            UPDATE "auctions" a
            SET "ownerId" = i."sellerId"
            FROM "items" i
            WHERE i.id = a."itemId"
        `);
    await queryRunner.query(
      `ALTER TABLE "auctions" ALTER COLUMN "ownerId" SET NOT NULL`,
    );

    await queryRunner.query(`
            ALTER TABLE "auctions"
            ADD CONSTRAINT "FK_auctions_ownerId_user_id"
            FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auctions" DROP CONSTRAINT "FK_auctions_ownerId_user_id"`,
    );

    await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN "ownerId"`);
  }
}
