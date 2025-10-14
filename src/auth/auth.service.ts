import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersService } from '../modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from "bcrypt";
import type { CreateUser } from '../modules/users/types/create-user.type';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class AuthService {

    constructor(
        private usersService : UsersService,
        @InjectRepository(User) private usersRepository : Repository<User>,
        private jwtService : JwtService
    ) {}

    async register(createUser : CreateUser) {
        const existingUser = await this.usersRepository.findOne({
            where : {email : createUser.email}
        });

        if (existingUser) {
            throw new BadRequestException("Email already exists")
        }
        
        if (createUser.password !== createUser.confirmPassword) {
            throw new BadRequestException("Password Confirm does not match password");
        }       

        const hashedPassword = await bcrypt.hash(createUser.password, 10);

        const user = await this.usersService.create({
            ...createUser,
            password : hashedPassword
        });

        const payload = {id : user.id, email : user.email, role : user.role, name : user.name};
        const token = this.jwtService.sign(payload);

        return {
            user : {id : user.id, email : user.email, name : user.name, role : user.role},
            token
        };
    }
    

async login(email: string, password: string) {
  const existingUser = await this.usersService.findByEmail(email);

  const match = await bcrypt.compare(password, existingUser.password);
  if (!match) throw new UnauthorizedException("Invalid credentials");

  const payload = { id: existingUser.id, email: existingUser.email, role: existingUser.role, name : existingUser.name};
  const token = this.jwtService.sign(payload);

  return {
    user: {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role,
    },
    token,
  };
}
}
