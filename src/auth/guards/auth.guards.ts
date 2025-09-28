import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user : User;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = req.headers.authorization;

    if (!authHeader)
      throw new UnauthorizedException('Authorization header missing');

    const [bearer, token] = authHeader?.split(' ');
    if (bearer !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid token');

    try {
      const payload = this.jwtService.verify(token);
      req.user = payload;
      console.log("Req User, after auth token verify: ", req.user);
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
