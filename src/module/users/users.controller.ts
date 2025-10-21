import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { UsersService } from './users.service';
import { type CreateUser } from './types/create-user.type';
import { type UpdateUser } from './types/update-user.type';
import { type FindUsersQuery } from './types/find-users-query.type';
import Joi from 'joi';
import { ValidationPipe } from 'src/pipes/joi-validator.pipe';
import { UserRole } from '../../def/enums/user_role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards()
  create(
    @Body(
      ValidationPipe.from(
        Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          password: Joi.string().required().min(8),
          confirmPassword: Joi.string().required().min(8),
          role: Joi.string()
            .valid(...Object.values(UserRole))
            .required(),
        }),
      ),
    )
    createUser: CreateUser,
  ) {
    return this.usersService.create(createUser);
  }

  @Get()
  findUsers(
    @Query(
      ValidationPipe.from(
        Joi.object({
          email: Joi.string().email(),
          name: Joi.string(),
          role: Joi.string().valid(...Object.values(UserRole)),
          limit: Joi.number(),
          page: Joi.number(),
        }),
      ),
    )
    query: FindUsersQuery,
  ) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(
      ValidationPipe.from(
        Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          password: Joi.string().required().min(8),
          confirmPassword: Joi.string().required().min(8),
          role: Joi.string()
            .valid(...Object.values(UserRole))
            .required(),
        }),
      ),
    )
    updateUser: UpdateUser,
  ) {
    return this.usersService.update(id, updateUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  // @Get(':id/items')
  // findSellerItems(@Param('id') id: string) {
  //   return this.usersService.findSellerItems(id);
  // }\

  // @Get(':id/biddings')
  // findBidderBids(@Param('id') id: string) {
  //   return this.usersService.findBidderBids(id);
  // }
}
