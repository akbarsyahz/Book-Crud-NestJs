import { ForbiddenException, Injectable, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, AuthResponseDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtGuard } from './guard';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signIn(dto: AuthDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ForbiddenException('Credential incorrect');
    }

    const pwMatches = await argon.verify(user.hash, dto.password);

    if (!pwMatches) {
      throw new ForbiddenException('Credential incorrect');
    }

    return this.signToken(user.id, user.email); // Menggunakan user.role dari Prisma
  }

  async signUp(dto: AuthDto): Promise<AuthResponseDto> {
    const hash = await argon.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, hash },
      });

      delete user.hash;

      return this.signToken(user.id, user.email); // Menggunakan user.role dari Prisma
    } catch (error) {
      console.error('Error in signUp:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.message.includes('Unique constraint failed on the fields: (`email`)')) {
          throw new ForbiddenException('Email address is already taken');
        }
      }
      throw error;
    }
  }

  async getUserRole(userId: number): Promise<UserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
  
    if (!user) {
      throw new ForbiddenException('User not found');
    }
  
    return user.role;
  }

  async signToken(userId: number, email: string): Promise<{ access_token: string, email: string }> {
    const payload = { sub: userId, email};
    const secret = this.config.get('JWT_SECRET');
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: secret,
    });

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { token: token },
      });
    } catch (error) {
      console.log(error);
    }

    return { access_token: token, email: email };
  }

  
  async logout(userId: number) {
    try {
        const user = await this.prisma.user.update({
          where: { id: userId },
          data: { token: null },
        });
        console.log('User token after logout:', user.token);
        return { message: 'User logout successfully' };
      } catch (error) {
        console.error('Error during logout:', error);
        throw new InternalServerErrorException('Failed to logout user');
      }
  }
}
