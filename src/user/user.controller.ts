import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { UserService } from './user.service';
import { EditUserDto } from './dto';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('users')
@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: 'Get current user details' })
  @ApiOkResponse({ description: 'Returns current user details' })
  @Get('me')
  getMe(@GetUser('id') userId: number) {
    return this.userService.getMe(userId);
  }


  @ApiOperation({ summary: 'Edit user details' })
  @ApiOkResponse({ description: 'User details have been successfully updated' })
  @Patch()
  @ApiBody({ type: EditUserDto })
  editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
    return this.userService.editUser(userId, dto);
  }
}
