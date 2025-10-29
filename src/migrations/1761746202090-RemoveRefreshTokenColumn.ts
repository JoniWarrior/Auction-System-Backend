import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRefreshTokenColumn1761746202090 implements MigrationInterface {
    name = 'RemoveRefreshTokenColumn1761746202090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refreshToken"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "refreshToken" character varying`);
    }

}
