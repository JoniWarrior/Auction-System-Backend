import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { NotificationsService } from "./../notifications/notifications.service";
import { AuctionsService } from "./../auctions/auctions.service";

@WebSocketGateway({
    cors: {
        origin: "*"
    }
})
export class BiddingsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private readonly notificationsService: NotificationsService,
        private readonly auctionsService: AuctionsService
    ) { }

    @WebSocketServer()
    server: Server


    private userSockets = new Map<string, string>();

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (userId) {
            this.userSockets.set(userId, client.id);
            console.log(`Client connected   : ${client.id}`);
            console.log("Map after connecting: ", this.userSockets);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.handshake.query.userId as string;
        for (const [userId, socketId] of this.userSockets.entries()) {
            if (socketId === client.id) {
                this.userSockets.delete(userId);
                console.log(`Client disconneted : ${client.id}`)
                break
            }
        }
    }

    @SubscribeMessage("joinAuction")
    handleJoinAuction(@MessageBody() auctionId: string, @ConnectedSocket() client: Socket) {
        client.join(`auction_${auctionId}`)
        console.log(`Client : ${client.id} joined auction : ${auctionId}`)
    }

    @SubscribeMessage("leaveAuction")
    handleLeaveAuction(@MessageBody() auctionId: string, @ConnectedSocket() client: Socket) {
        client.leave(`auction_${auctionId}`)
        console.log(`Client ${client.id} left the auction : ${auctionId}`);
    }

    broadcastNewBid(auctionId: string, bidding: any) {
        this.server.to(`auction_${auctionId}`).emit("newBid", bidding);
    }

    // async broadcastOutBid(auctionId: string, bidding: any, outbidderIds: string[]) {
    //     const auction = await this.auctionsService.findOne(auctionId);

    //     if (!auction) return;

    //     const message = `You have been outbid in auction: ${auction.item.title} with bid: ${bidding.amount}`;

    //     for (const userId of outbidderIds) {
    //         const socketId = this.userSockets.get(userId);

    //         // save notification in DB
    //         await this.notificationsService.create(userId, auctionId, message);

    //         // emit to connected user
    //         if (socketId) {
    //             this.server.to(socketId).emit("outBid", { message, bidding });
    //         }
    //     }
    // }

    broadcastOutBid(auctionId: string, bidding: any, bidderId: string) {
        const bidderSocketId = this.userSockets.get(bidderId);
        console.log("Map after out Bid: ", this.userSockets);
        if (bidderSocketId) {
            this.server.to(`auction_${auctionId}`).except(bidderSocketId).emit("outBid", bidding);
        } else {
            this.server.to(`auction_${auctionId}`).emit("outbid", bidding);
        }
    }

    @SubscribeMessage("startBidding")
    handleStartBidding(
        @MessageBody() data: { auctionId: string, userName: String },
        @ConnectedSocket() client: Socket
    ) {
        client.to(`auction_${data.auctionId}`).emit("biddingIndicator", {
            userName: data.userName,
            isBidding: true
        });
    }


    @SubscribeMessage("stopBidding")
    handleStopBidding(
        @MessageBody() data: { auctionId: string, userName: string },
        @ConnectedSocket() client: Socket
    ) {
        client.to(`auction_${data.auctionId}`).emit("biddingIndicator", {
            userName: data.userName,
            isBidding: false
        })
    }
}