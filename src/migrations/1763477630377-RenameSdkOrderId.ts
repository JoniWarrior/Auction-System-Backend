import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameSdkOrderId1763477630377 implements MigrationInterface {
    name = 'RenameSdkOrderId1763477630377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "transactionId" TO "sdkOrderId"`);
        await queryRunner.query(`ALTER TABLE "transactions" RENAME CONSTRAINT "UQ_1eb69759461752029252274c105" TO "UQ_55a4d9c7d06cc0f03c6969919bf"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" RENAME CONSTRAINT "UQ_55a4d9c7d06cc0f03c6969919bf" TO "UQ_1eb69759461752029252274c105"`);
        await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "sdkOrderId" TO "transactionId"`);
    }

}
