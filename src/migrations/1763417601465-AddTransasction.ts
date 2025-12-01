import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransasction1763417601465 implements MigrationInterface {
  name = 'AddTransasction1763417601465';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('success', 'fail', 'cancel', 'processing')`,
    );

    await queryRunner.query(
      `CREATE TABLE "transactions" (
                                     "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                                     "transactionId" character varying NOT NULL,
                                     "status" "public"."transactions_status_enum" NOT NULL,
                                     "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                                     "cancelledAt" TIMESTAMP,
                                     "biddingId" uuid,
                                     CONSTRAINT "UQ_1eb69759461752029252274c105" UNIQUE ("transactionId"),
                                     CONSTRAINT "REL_3d497010a9caef9f89f4b77007" UNIQUE ("biddingId"),
                                     CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id")
       )`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions"
        ADD CONSTRAINT "FK_3d497010a9caef9f89f4b770072"
          FOREIGN KEY ("biddingId") REFERENCES "biddings"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_3d497010a9caef9f89f4b770072"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
  }
}
