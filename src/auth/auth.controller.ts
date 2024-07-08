import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, AuthResponseDto  } from "./dto";
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetUser } from '../auth/decorator'; 
import { JwtGuard } from './guard'

@ApiTags('Auth')
@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService) {}

    @ApiOperation({ summary: 'User Signup' })
    @ApiCreatedResponse({ description: 'User has been successfully registered', type: AuthResponseDto })
    @Post('signup') 
    @ApiBody({ type: AuthDto })
    signup(@Body() dto: AuthDto): Promise<AuthResponseDto>{
        return this.authService.signUp(dto);
    }

    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User Signin' })
    @ApiCreatedResponse({ description: 'User has been successfully signed in', type: AuthResponseDto })
    @Post('signin')
    @ApiBody({ type: AuthDto })
    signin(@Body() dto: AuthDto): Promise<AuthResponseDto>{
        return this.authService.signIn(dto);
    }
  
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User Logout' })
    @ApiCreatedResponse({ description: 'User has been successfully Logout'})
    @UseGuards(JwtGuard)
    @Post('logout')
    async logout(@GetUser('id') userId: number){
        const result = await this.authService.logout(userId);
        return result;
    }

}