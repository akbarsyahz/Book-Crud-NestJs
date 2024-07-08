import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { AuthService } from '../../auth/auth.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector, private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('Checking roles...');

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    this.logger.log('Required roles:', requiredRoles);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    this.logger.log('User:', user);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userRole = await this.authService.getUserRole(user.id);
    const userRoleString = userRole.toString();
    this.logger.log('User role:', userRole);

    if (!requiredRoles.map(role => role.toString()).includes(userRoleString)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
