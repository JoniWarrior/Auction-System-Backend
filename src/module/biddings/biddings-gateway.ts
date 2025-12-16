import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '../notifications/notifications.service';
import { AuctionsService } from '../auctions/auctions.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BiddingsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly auctionsService: AuctionsService,
    private readonly usersService: UsersService,
  ) {}

  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSockets.set(userId, client.id);
      console.log(`Client connected   : ${client.id}`);
      console.log('Map after connecting: ', this.userSockets);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        console.log(`Client disconneted : ${client.id}`);
        break;
      }
    }
  }

  @SubscribeMessage('joinAuction')
  handleJoinAuction(
    @MessageBody() auctionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`auction_${auctionId}`);
    console.log(`Client : ${client.id} joined auction : ${auctionId}`);
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(
    @MessageBody() auctionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`auction_${auctionId}`);
    console.log(`Client ${client.id} left the auction : ${auctionId}`);
  }

  broadcastNewBid(auctionId: string, bidding: any) {
    this.server.to(`auction_${auctionId}`).emit('newBid', bidding);
  }

  async broadcastOutBid(
    auctionId: string,
    bidding: any,
    outbidderIds: string[],
  ) {
    const auction = await this.auctionsService.findOne(auctionId);
    if (!auction) return;

    const message = `You have been outbid in auction: ${auction.item.title} with bid: ${bidding.amount}`;

    for (const userId of outbidderIds) {
      const socketId = this.userSockets.get(userId);

      const notification = await this.notificationsService.create(
        userId,
        auctionId,
        message,
      );
      if (socketId) {
        this.server.to(socketId).emit('outBid', notification);
      }
    }
  }

  @SubscribeMessage('startBidding')
  async handleStartBidding(
    @MessageBody() data: { auctionId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.usersService.findOne(data.userId);
    client.to(`auction_${data.auctionId}`).emit('biddingIndicator', {
      userName: user?.name ?? 'Unknown User',
      isBidding: true,
    });
  }

  @SubscribeMessage('stopBidding') async handleStopBidding(
    @MessageBody() data: { auctionId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.usersService.findOne(data.userId);
    client.to(`auction_${data.auctionId}`).emit('biddingIndicator', {
      userName: user?.name ?? 'Unknown User',
      isBidding: false,
    });
  }
}
