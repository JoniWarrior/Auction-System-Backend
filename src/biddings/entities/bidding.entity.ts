import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn} from "typeorm";
import { Auction } from "./../../auctions/entities/auction.entity";
import { User } from "./../../users/entities/user.entity";

@Entity("biddings")
export class Bidding {

    @PrimaryGeneratedColumn("uuid")
    id : string

    @Column()
    amount : number
    
    @ManyToOne(() => Auction, (auction) => auction.biddings, {onDelete : "CASCADE"})
    @JoinColumn({name : "auction_id"})
    auction : Auction
    
    @ManyToOne(() => User, (bidder) => bidder.biddings, {onDelete : "CASCADE"})
    @JoinColumn({name : "bidder_id"})
    bidder : User
    
    @CreateDateColumn()
    created_at : Date
}
