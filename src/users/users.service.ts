import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { User, Role } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import { Item } from './../items/entities/item.entity';
import { Bidding } from './../biddings/entities/bidding.entity';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { ItemsService } from './../items/items.service';
import { BiddingsService } from './../biddings/biddings.service';


@Injectable()
export class UsersService {
  constructor(@InjectRepository(User)
  private usersRepository: Repository<User>,
    private itemsService: ItemsService,

    @Inject(forwardRef(() => BiddingsService))
    private biddingsService: BiddingsService
  ) { }

  private async getUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with Id: ${id} not found!`)
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create({
      ...createUserDto,
      role: createUserDto.role || Role.BIDDER,
    });
    return this.usersRepository.save(user);
  };

  async findOne(id: string, relations : string[] = []): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations
    });
    if (!user) {
      throw new NotFoundException(`User with Id: ${id} not found in the DB! `);
    }
    return user;
  }

  async findByEmail(email : string) : Promise<User> {
    const user = await this.usersRepository.findOne({where : {email}});
    if( !user ) throw new NotFoundException(`User with email ${email} not found!`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getUser(id);
    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    return this.usersRepository.save(updatedUser);
  }

  async remove(id: string): Promise<User> {
    const user = await this.getUser(id);
    await this.usersRepository.remove(user);
    return user;
  }

  async findSellerItems(id: string): Promise<Item[]> {
    const user = await this.getUser(id);
    if (user.role !== Role.SELLER)
      throw new BadRequestException(`The user with Id: ${id} is not registered as a seller!`);
    return this.itemsService.findBySeller(id);
  }

  async findBidderBids(id: string): Promise<Bidding[]> {
    const user = await this.getUser(id);
    if (user.role !== Role.BIDDER) throw new BadRequestException(`User with Id : ${id} is not a bidder`)
    return this.biddingsService.findBidsByBider(user.id);
  }

  async findAll(filters: FindUsersQueryDto): Promise<User[]> {
    const where: FindOptionsWhere<User> = {};

    if (filters.email) where.email = filters.email;
    if (filters.name) where.name = ILike(`%${filters.name}%`);
    if (filters.role) where.role = filters.role;

    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;
    const skip = (page - 1) * limit;

    return this.usersRepository.find({
      where,
      take: limit,
      skip,
      order: { name: "ASC" }
    });
  }
}
