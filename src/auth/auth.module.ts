import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../module/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { JwtAuthStrategy } from './strategy/jwt-auth.strategy';
import { JWT } from '../dynamic-module/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule, JWT,
  PassportModule.register({ defaultStrategy: 'jwt-auth' }),
],
  providers: [AuthService, JwtAuthGuard, JwtAuthStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
