// import { MigrationInterface, QueryRunner } from "typeorm";

// export class MakeWinnerBidIdNullable1761055686442 implements MigrationInterface {
//     name = 'MakeWinnerBidIdNullable1761055686442'

//     public async up(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_35e61d3edbf0f7cb012501e3349"`);
//         await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "winnerBidId" DROP NOT NULL`);
//         await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_35e61d3edbf0f7cb012501e3349" FOREIGN KEY ("winnerBidId") REFERENCES "biddings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
//     }

//     public async down(queryRunner: QueryRunner): Promise<void> {
//         await queryRunner.query(`ALTER TABLE "auctions" DROP CONSTRAINT "FK_35e61d3edbf0f7cb012501e3349"`);
//         await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "winnerBidId" SET NOT NULL`);
//         await queryRunner.query(`ALTER TABLE "auctions" ADD CONSTRAINT "FK_35e61d3edbf0f7cb012501e3349" FOREIGN KEY ("winnerBidId") REFERENCES "biddings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
//     }

// }
