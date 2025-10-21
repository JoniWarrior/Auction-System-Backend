import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdColumns1761054870453 implements MigrationInterface {
    name = 'AddIdColumns1761054870453'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "biddings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" integer NOT NULL, "auctionId" uuid NOT NULL, "bidderId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_7e33475be248d1fa69b1ccaa74a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auctions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startingPrice" integer NOT NULL, "currentPrice" integer NOT NULL, "endTime" TIMESTAMP NOT NULL, "status" "public"."auctions_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "itemId" uuid NOT NULL, "winnerBidId" uuid NOT NULL, "deletedAt" TIMESTAMP, CONSTRAINT "REL_d6147892790737abeeac9f902a" UNIQUE ("itemId"), CONSTRAINT "REL_35e61d3edbf0f7cb012501e334" UNIQUE ("winnerBidId"), CONSTRAINT "PK_87d2b34d4829f0519a5c5570368" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eec682e1e2b3c3d8ebaec7f2b5" ON "auctions" ("status", "endTime") `);
        await queryRunner.query(`CREATE TABLE "items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying NOT NULL, "imageURL" character varying NOT NULL, "sellerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'bidder', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "auctionId" character varying NOT NULL, "message" character varying NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "biddings" ADD CONSTRAINT "FK_4971335af7eeb26a4ba56adcc26" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "biddings" ADD CONSTRAINT "FK_8b3f0180d583494f7edb28bb2aa" FOREIGN KEY ("bidderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_d6147892790737abeeac9f902a2" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_35e61d3edbf0f7cb012501e3349" FOREIGN KEY ("winnerBidId") REFERENCES "biddings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "items" ADD CONSTRAINT "FK_63e65ad885f4161dabb35d90e09" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "items" DROP CONSTRAINT "FK_63e65ad885f4161dabb35d90e09"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_35e61d3edbf0f7cb012501e3349"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_d6147892790737abeeac9f902a2"`);
        await queryRunner.query(`ALTER TABLE "biddings" DROP CONSTRAINT "FK_8b3f0180d583494f7edb28bb2aa"`);
        await queryRunner.query(`ALTER TABLE "biddings" DROP CONSTRAINT "FK_4971335af7eeb26a4ba56adcc26"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eec682e1e2b3c3d8ebaec7f2b5"`);
        await queryRunner.query(`DROP TABLE "auctions"`);
        await queryRunner.query(`DROP TABLE "biddings"`);
    }

}
