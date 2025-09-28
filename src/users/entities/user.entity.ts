import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany} from "typeorm";
import { Item } from "./../../items/entities/item.entity";
import { Bidding } from "src/biddings/entities/bidding.entity";

export enum Role {
    BIDDER = "bidder",
    SELLER = "seller",
    ADMIN = "admin"
};

@Entity()
export class User {

    @PrimaryGeneratedColumn("uuid")
    id : string;

    @Column()
    name : string;

    @Column({unique : true})
    email : string;

    @Column()
    password  : string;

    @Column({
        type : "enum",
        enum : Role,
        default : Role.BIDDER
    })
    role : Role

    @CreateDateColumn()
    created_at : Date   

    @OneToMany(() => Item, (item) => item.seller, {onDelete : "CASCADE"})
    items : Item[];

    @OneToMany(() => Bidding, (bidding) => bidding.bidder, {onDelete : "CASCADE"})
    biddings : Bidding[];

}
