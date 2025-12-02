import { MigrationInterface, QueryRunner } from "typeorm";

export class ModifyCardEntity1764525532807 implements MigrationInterface {
    name = 'ModifyCardEntity1764525532807'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "card" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pokCardId" character varying NOT NULL, "lastDigits" character varying NOT NULL, "cardType" character varying, "expireDate" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isDefault" boolean NOT NULL DEFAULT false, "userId" uuid, CONSTRAINT "PK_9451069b6f1199730791a7f4ae4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "card" ADD CONSTRAINT "FK_77d7cc9d95dccd574d71ba221b0" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "card" DROP CONSTRAINT "FK_77d7cc9d95dccd574d71ba221b0"`);
        await queryRunner.query(`DROP TABLE "card"`);
    }

}
