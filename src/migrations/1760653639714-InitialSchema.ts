import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1760653639714 implements MigrationInterface {
    name = 'InitialSchema1760653639714'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "biddings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "auction_id" uuid, "bidder_id" uuid, CONSTRAINT "PK_7e33475be248d1fa69b1ccaa74a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auctions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "starting_price" integer NOT NULL, "current_price" integer NOT NULL, "end_time" TIMESTAMP NOT NULL, "status" "public"."auctions_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "item_id" uuid, "winner_bid_id" uuid, CONSTRAINT "REL_261cd2fbd597ff315b91ca434e" UNIQUE ("item_id"), CONSTRAINT "REL_f7951fc2b671684ea9ff3879e4" UNIQUE ("winner_bid_id"), CONSTRAINT "PK_87d2b34d4829f0519a5c5570368" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_78a0fc0a314245bd12ed36ee78" ON "auctions" ("status", "end_time") `);
        await queryRunner.query(`CREATE TABLE "items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying NOT NULL, "imageURL" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "seller_id" uuid, CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'bidder', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "auctionId" character varying NOT NULL, "message" character varying NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "biddings" ADD CONSTRAINT "FK_e78812219429c0589780604efe3" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "biddings" ADD CONSTRAINT "FK_17f4d78225c6a135527c41cf565" FOREIGN KEY ("bidder_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_261cd2fbd597ff315b91ca434e8" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_f7951fc2b671684ea9ff3879e44" FOREIGN KEY ("winner_bid_id") REFERENCES "biddings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "items" ADD CONSTRAINT "FK_20719f5611327abb661f3cccb9a" FOREIGN KEY ("seller_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "items" DROP CONSTRAINT "FK_20719f5611327abb661f3cccb9a"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_f7951fc2b671684ea9ff3879e44"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_261cd2fbd597ff315b91ca434e8"`);
        await queryRunner.query(`ALTER TABLE "biddings" DROP CONSTRAINT "FK_17f4d78225c6a135527c41cf565"`);
        await queryRunner.query(`ALTER TABLE "biddings" DROP CONSTRAINT "FK_e78812219429c0589780604efe3"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78a0fc0a314245bd12ed36ee78"`);
        await queryRunner.query(`DROP TABLE "auctions"`);
        await queryRunner.query(`DROP TABLE "biddings"`);
    }
}
