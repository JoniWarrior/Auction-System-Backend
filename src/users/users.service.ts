import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User, Role} from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import { Item } from './../items/entities/item.entity';
import { Bidding } from './../biddings/entities/bidding.entity';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User)
              private usersRepository : Repository<User>,

              @InjectRepository(Item)
              private itemsRepository : Repository<Item>,

              @InjectRepository(Bidding)
              private biddingsRepository : Repository<Bidding>
            ) {}

  async create(createUserDto : CreateUserDto) : Promise<User> {
    const user = this.usersRepository.create({
    ...createUserDto,
    role: createUserDto.role || Role.BIDDER,
  });
    return this.usersRepository.save(user);
  };

  async findAll() : Promise<User[]> {
    const users = await this.usersRepository.find();
    if (users.length === 0) {
      return []
    }
    return users;
  };

  async findOne(id : string) : Promise<User>{
    const user = await this.usersRepository.findOne({
      where: {id},
      relations : ["items"]
    });
    if (!user) {
      throw new NotFoundException(`User with ID: ${id} not found in the DB! `);
    }
    return user;
  }

  async update(id : string, updateUserDto : UpdateUserDto) : Promise<User> {
    const originalUser = await this.usersRepository.findOneBy({ id });
    if (!originalUser) {
      throw new NotFoundException(`User with ID ${id} not found in the DB! `)
    }

    const updatedUser = this.usersRepository.merge(originalUser, updateUserDto);
    return this.usersRepository.save(updatedUser);
  }

  async remove(id : string) : Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist `);
    }
    await this.usersRepository.remove(user);
    return user;
  }

  async findSellerItems(id : string) : Promise<Item[]> {
    const user = await this.usersRepository.findOneBy({id});
    if (!user) {
      throw new NotFoundException(`User with Id: ${id} does not exist in the DB`)
    }
    if (user.role !== "seller") {
      throw new BadRequestException("The user is not registered as a seller!")
    }

    const items = await this.itemsRepository.find({
        select : ["id", "title", "description"],  
        where : {seller : {id : user.id}},
    });

    if (items.length === 0) {
      throw new NotFoundException(`This seller has not yet registered any item for sale`)
    }
    return items;
  }

  async findBidderBids(id : string) : Promise<Bidding[]> {
    const bidder = await this.usersRepository.findOneBy({id});
    if (!bidder) {
      throw new NotFoundException(`User with Id : ${id} not registered yet`)
    }

    if (bidder.role !== "bidder") {
      throw new BadRequestException(`User with Id : ${id} is not registered as a bidder`)
    }

    const biddings = await this.biddingsRepository
    .createQueryBuilder("bidding")
    .leftJoinAndSelect("bidding.auction", "auction")
    .leftJoinAndSelect("auction.item", "item")
    .select([
      "bidding.id",
      "bidding.amount",
      "bidding.created_at",
      "auction.id",
      "auction.starting_price",
      "auction.current_price",
      "auction.end_time",
      "auction.status",
      "item.title",
      "item.description"
    ])
    .where("bidding.bidder_id = :bidderId", { bidderId: bidder.id })
    .getMany();

    if (biddings.length === 0) {
      throw new NotFoundException(`The user with Id ${id} has not made any bidding yet`)
    }
    return biddings;
  }

  async findByEmail (email : string) : Promise<User> {
    const user = await this.usersRepository.findOne({where : {email}});
    if (!user) {
      throw new NotFoundException(`User with email : ${email} does not exist!`)
    };
    return user;
  }

  

  async findWithFilters(filters : FindUsersQueryDto) : Promise<User[]> {
    const where : any = {};

    if (filters.email) {
      where.email = filters.email;
    }

    if (filters.name) {
    where.name = ILike(`%${filters.name}%`);
  }
  
    if (filters.role) {
    where.role = filters.role;
    }
    return this.usersRepository.find({where});
  }
}
