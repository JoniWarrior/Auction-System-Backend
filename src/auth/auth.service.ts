import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../entity/user.entity';
import { UsersService } from '../module/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { type CreateUser } from 'src/def/types/user/create-user.type';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(createUser: CreateUser) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUser.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    if (createUser.password !== createUser.confirmPassword) {
      throw new BadRequestException('Password Confirm does not match password');
    }

    const hashedPassword = await bcrypt.hash(createUser.password, 10);

    const user = await this.usersService.create({
      ...createUser,
      password: hashedPassword,
    });
    // TODO : Refactor this part cause is the same in login too
    const payload = { id: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      payload,
      { expiresIn: '7d' },
    );
    user.accessToken = accessToken;
    await this.usersRepository.save(user);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken
    };
  }

  async login(email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);

    const match = await bcrypt.compare(password, existingUser.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      id: existingUser.id,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      payload,
      { expiresIn: '7d' },
    );
    existingUser.accessToken = accessToken;
    // existingUser.refreshToken = refreshToken;
  
    await this.usersRepository.save(existingUser);

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    // if (!user || !user.refreshToken) {
    //   throw new UnauthorizedException('Invalid refresh token');
    // }

    try {

      this.jwtService.verify(refreshToken);

      // Generate new access token
      const payload = { id: user?.id };
      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: '1h',
      });



      return { accessToken: newAccessToken };
    } catch (err) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }
}
