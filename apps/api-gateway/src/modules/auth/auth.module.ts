import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaticUserRepository } from './repositories/static-user.repository';
import { USER_REPOSITORY } from './repositories/user.repository.interface';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    // Swap this one line to change the user store:
    // { provide: USER_REPOSITORY, useClass: DrizzleUserRepository }  ← real DB
    // { provide: USER_REPOSITORY, useClass: PrismaUserRepository }   ← alternative DB
    { provide: USER_REPOSITORY, useClass: StaticUserRepository },
  ],
  exports: [AuthService],
})
export class AuthModule {}
