import { Controller, Post, Body} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService : AuthService // could remove readonly
    ) {}

    @Post("register")
    register(@Body() createUserDto : CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Post("login")
    login(@Body() body : {email : string, password : string}) {
        return this.authService.login(body.email, body.password);
    }


}
