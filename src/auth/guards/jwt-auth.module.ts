import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './auth.guards';
import { RolesGuard } from './roles.guards';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { JwtModul } from 'src/dynamic-modules/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModul
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, JwtModule, RolesGuard, TypeOrmModule],
})
export class JwtAuthModule {}