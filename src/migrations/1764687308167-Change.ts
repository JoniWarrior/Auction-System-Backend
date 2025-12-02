import { MigrationInterface, QueryRunner } from "typeorm";

export class Change1764687308167 implements MigrationInterface {
    name = 'Change1764687308167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "card" DROP COLUMN "cardType"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "card" ADD "cardType" character varying`);
    }

}
