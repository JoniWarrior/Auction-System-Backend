import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokenColumn1761669300772 implements MigrationInterface {
    name = 'AddRefreshTokenColumn1761669300772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "refreshToken" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refreshToken"`);
    }
}
