import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAmountAllField1766333368754 implements MigrationInterface {
    name = 'RemoveAmountAllField1766333368754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "biddings" DROP COLUMN "amountAll"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "biddings" ADD "amountAll" numeric NOT NULL`);
    }

}
