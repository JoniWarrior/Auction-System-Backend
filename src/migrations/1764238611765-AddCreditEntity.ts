import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditEntity1764238611765 implements MigrationInterface {
    name = 'AddCreditEntity1764238611765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_auctions_ownerId_user_id"`);
        await queryRunner.query(`CREATE TABLE "credit_card" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cardNumber" character varying NOT NULL, "expiresDate" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "cancelledAt" TIMESTAMP, "cvc" character varying NOT NULL, "cardName" character varying NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, "state" character varying NOT NULL, "userId" uuid, CONSTRAINT "PK_97c08b6c8d5c1df81bf1a96c43e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."transactions_status_enum" RENAME TO "transactions_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('success', 'fail', 'cancel', 'on hold', 'refunded')`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "public"."transactions_status_enum" USING "status"::"text"::"public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_ec74ccf82cc14ed760d18742fe4" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_card" ADD CONSTRAINT "FK_5af060e164a7e2764ed1b15589d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "credit_card" DROP CONSTRAINT "FK_5af060e164a7e2764ed1b15589d"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_ec74ccf82cc14ed760d18742fe4"`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum_old" AS ENUM('success', 'fail', 'cancel', 'on hold')`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "public"."transactions_status_enum_old" USING "status"::"text"::"public"."transactions_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transactions_status_enum_old" RENAME TO "transactions_status_enum"`);
        await queryRunner.query(`DROP TABLE "credit_card"`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_auctions_ownerId_user_id" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
