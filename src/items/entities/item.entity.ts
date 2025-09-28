import { User } from "./../../users/entities/user.entity";
import { Auction } from "./../../auctions/entities/auction.entity";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToOne, JoinColumn } from "typeorm";

@Entity("items")
export class Item {

    @PrimaryGeneratedColumn("uuid")
    id : string

    @Column()
    title : string

    @Column()
    description : string

    @Column({nullable : false})
    imageURL : string;

    @ManyToOne(() => User, (user) => user.items, {onDelete : "CASCADE"})
    @JoinColumn({ name : "seller_id"})
    seller : User;

    @OneToOne(() => Auction, (auction) => auction.item, {onDelete : "CASCADE"})
    auction : Auction;

    @CreateDateColumn()
    created_at : Date



}
