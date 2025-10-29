import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccesTokenColumn1761675477798 implements MigrationInterface {
    name = 'AddAccesTokenColumn1761675477798'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "accessToken" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "accessToken"`);
    }

}
