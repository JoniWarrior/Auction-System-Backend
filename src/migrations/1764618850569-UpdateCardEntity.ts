import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCardEntity1764618850569 implements MigrationInterface {
    name = 'UpdateCardEntity1764618850569'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "card" DROP COLUMN "lastDigits"`);
        await queryRunner.query(`ALTER TABLE "card" DROP COLUMN "expireDate"`);
        await queryRunner.query(`ALTER TABLE "card" ADD "hiddenNumber" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "card" ADD "expirationMonth" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "card" ADD "expirationYear" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "card" DROP COLUMN "expirationYear"`);
        await queryRunner.query(`ALTER TABLE "card" DROP COLUMN "expirationMonth"`);
        await queryRunner.query(`ALTER TABLE "card" DROP COLUMN "hiddenNumber"`);
        await queryRunner.query(`ALTER TABLE "card" ADD "expireDate" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "card" ADD "lastDigits" character varying NOT NULL`);
    }

}
