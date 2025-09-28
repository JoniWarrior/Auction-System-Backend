import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { Item } from "./../../items/entities/item.entity";
import {Bidding} from "./../../biddings/entities/bidding.entity";


export enum STATUS {
    ACTIVE = "active",
    PENDING = "pending",
    FINISHED = "finished"
}
@Entity("auctions")
@Index(["status", "end_time"])
export class Auction {

    @PrimaryGeneratedColumn("uuid")
    id : string

    @Column()
    starting_price : number

    @Column({nullable : false})
    current_price : number

    @Column()
    end_time : Date
 
    @Column({
        type : "enum",
        enum : STATUS,
        default : STATUS.PENDING
    })
    status : STATUS

    @CreateDateColumn()
    created_at : Date

    @OneToOne(() => Item, (item) => item.auction)
    @JoinColumn({name : "item_id"})
    item : Item

    @OneToMany(() => Bidding, (bidding) => bidding.auction, {onDelete : "CASCADE"})
    biddings : Bidding[]

    @OneToOne(() => Bidding, {nullable : true})
    @JoinColumn({name : "winner_bid_id"})
    winningBid : Bidding

}