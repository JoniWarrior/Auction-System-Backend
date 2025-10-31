import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAccessTokenColumn1761816124100 implements MigrationInterface {
    name = 'RemoveAccessTokenColumn1761816124100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "accessToken"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "accessToken" character varying`);
    }
}
