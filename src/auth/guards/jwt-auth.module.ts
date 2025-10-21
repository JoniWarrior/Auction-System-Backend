import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth.guards';
import { RolesGuard } from './roles.guards';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entity/user.entity';
import { JWT } from 'src/dynamic-module/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JWT
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, JwtModule, RolesGuard, TypeOrmModule],
})
export class JwtAuthModule {}
