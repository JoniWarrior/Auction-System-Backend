import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import path from 'node:path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.TEST_EMAIL,
            pass: process.env.TEST_EMAIL_PASSWORD,
          },
        },
        defaults: {
          from: `"Auction App" <${process.env.TEST_EMAIL}>`,
        },
        template: {
          dir: path.join(__dirname, '../../../templates'),
          adapter: new PugAdapter(),
          options: {
            strict: true,
          },
        },

        tls: {
          rejectUnauthorized: false,
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
