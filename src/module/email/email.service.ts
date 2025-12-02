import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOutBidEmail(
    to: string,
    data: { auctionTitle: string; newBidAmount: number },
  ) {
    await this.mailerService.sendMail({
      from: `"Auction App" <${process.env.TEST_EMAIL}>`,
      to,
      subject: `You have been outbid in ${data.auctionTitle}`,
      template: 'outbid-notification',
      context: {
        auctionTitle: data.auctionTitle,
        newBidAmount: data.newBidAmount,
      },
    });
  }
}
