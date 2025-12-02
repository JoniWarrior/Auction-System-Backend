import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDateColumnsInCardModel1764687199135 implements MigrationInterface {
    name = 'RemoveDateColumnsInCardModel1764687199135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "card" DROP COLUMN "expirationMonth"`);
        await queryRunner.query(`ALTER TABLE "card" DROP COLUMN "expirationYear"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "card" ADD "expirationYear" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "card" ADD "expirationMonth" character varying NOT NULL`);
    }

}
