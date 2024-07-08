import { Module, Logger } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BookModule } from './book/book.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { TransformResponseInterceptor } from './transform-response/transform-response.interceptor';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  providers: [Logger, TransformResponseInterceptor],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    BookModule,
    PrismaModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 5,
    }]),
  ],
})
export class AppModule {}
