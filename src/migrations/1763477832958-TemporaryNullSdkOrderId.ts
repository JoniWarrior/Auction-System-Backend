import { MigrationInterface, QueryRunner } from "typeorm";

export class TemporaryNullSdkOrderId1763477832958 implements MigrationInterface {
    name = 'TemporaryNullSdkOrderId1763477832958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "sdkOrderId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "sdkOrderId" SET NOT NULL`);
    }

}
