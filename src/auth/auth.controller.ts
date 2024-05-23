import { Body, Controller, HttpCode, HttpStatus, Post} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags()
@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService) {}

    @ApiOperation({ summary: 'User Signup' })
    @ApiCreatedResponse({ description: 'User has been successfully registered' })
    @Post('signup') 
    @ApiBody({ type: AuthDto })
    signup(@Body() dto: AuthDto){
        return this.authService.signUp(dto);
    }

    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User Signin' })
    @ApiCreatedResponse({ description: 'User has been successfully signed in' })
    @Post('signin')
    @ApiBody({ type: AuthDto })
    signin(@Body() dto: AuthDto){
        return this.authService.signIn(dto);
    }

}