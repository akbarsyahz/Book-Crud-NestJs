import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Access token' })
  access_token: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;
}
