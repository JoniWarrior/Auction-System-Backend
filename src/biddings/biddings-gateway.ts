import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: "*"
    }
})
export class BiddingsGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server


    handleConnection(client: Socket) {
        console.log(`Client connected : ${client.id}`)
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconneted : ${client.id}`)
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

    @SubscribeMessage("startBidding")
    handleStartBidding(
        @MessageBody() data : {auctionId : string, userName : String},
        @ConnectedSocket() client : Socket
    ) {
        client.to(`auction_${data.auctionId}`).emit("biddingIndicator", {
            userName : data.userName,
            isBidding : true
        });
    }


    @SubscribeMessage("stopBidding")
    handleStopBidding(
        @MessageBody() data : {auctionId : string, userName : string},
        @ConnectedSocket() client : Socket
    )
     {
        client.to(`auction_${data.auctionId}`).emit("biddingIndicator", {
            userName : data.userName,
            isBidding : false
        })
     }
}