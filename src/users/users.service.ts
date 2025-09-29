import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
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

private async getUserOrFail(id : string) : Promise<User> {
  const user = await this.usersRepository.findOne({where : {id}});
  if (!user) throw new NotFoundException(`User with Id: ${id} not found!`)
  return user;
}

async create(createUserDto : CreateUserDto) : Promise<User> {
    const user = this.usersRepository.create({
    ...createUserDto,
    role: createUserDto.role || Role.BIDDER,
  });
    return this.usersRepository.save(user);
  };

  async findAll() : Promise<User[]> {
    const users = await this.usersRepository.find();
    return users;
  };

  async findOne(id : string) : Promise<User>{
    const user = await this.usersRepository.findOne({
      where: {id},
      relations : ["items"]
    });
    if (!user) {
      throw new NotFoundException(`User with Id: ${id} not found in the DB! `);
    }
    return user;
  }

  async update(id : string, updateUserDto : UpdateUserDto) : Promise<User> {
    const user = await this.getUserOrFail(id);
    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(updatedUser);
  }

  async remove(id : string) : Promise<User> {
    const user = await this.getUserOrFail(id);
    await this.usersRepository.remove(user);
    return user;
  }

  async findSellerItems(id : string) : Promise<Item[]> {
    const user = await this.getUserOrFail(id);
    if (user.role !== Role.SELLER)
      throw new BadRequestException(`The user with Id: ${id} is not registered as a seller!`)

    const items = await this.itemsRepository.find({
        select : ["id", "title", "description"],  
        where : {seller : {id : user.id}},
    });

    if (!items.length) 
      throw new NotFoundException(`The seller with ${id} has no items listed`)
    return items;
  }

  async findBidderBids(id : string) : Promise<Bidding[]> {
    const user = await this.getUserOrFail(id);

    if (user.role !== Role.BIDDER) throw new BadRequestException(`User with Id : ${id} is not a bidder`)

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
    .where("bidding.bidder_id = :bidderId", { bidderId: user.id })
    .getMany();

    if (!biddings.length)
      throw new NotFoundException(`The user with Id ${id} has not place any bidding`)
  
    return biddings;
  }

  async findByEmail (email : string) : Promise<User> {
    const user = await this.usersRepository.findOne({where : {email}});
    if (!user) {
      throw new NotFoundException(`User with email : ${email} not found!`)
    };
    return user;
  }

  async findWithFilters(filters : FindUsersQueryDto) : Promise<User[]> {
    const where : FindOptionsWhere<User> = {};

    if (filters.email) where.email = filters.email;
    if (filters.name) where.name = ILike(`%${filters.name}%`);
    if (filters.role) where.role = filters.role;
 
    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;
    const skip = (page - 1) * limit;

    return this.usersRepository.find({
      where,
      take : limit,
      skip,
      order : {name : "ASC"}
    });
  }
}
