import { Controller, Post, Body} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { CreateUser } from '../modules/users/types/create-user.type';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService : AuthService
    ) {}

    @Post("register")
    register(@Body() createUser : CreateUser) {
        return this.authService.register(createUser);
    }

    @Post("login")
    login(@Body() body : {email : string, password : string}) {
        return this.authService.login(body.email, body.password);
    }


}
