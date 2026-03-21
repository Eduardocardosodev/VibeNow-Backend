import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserUsecase } from './usecases/User.usecase';
import { IRepositoryUser } from './infrastructure/repository/IRepository.repository';
import { PrismaUserRepository } from './infrastructure/repository/PrismaUser.repository';

export const IREPOSITORY_USER = Symbol('IRepositoryUser');

@Module({
  controllers: [UserController],
  providers: [
    PrismaUserRepository,
    {
      provide: IREPOSITORY_USER,
      useExisting: PrismaUserRepository,
    },
    {
      provide: UserUsecase,
      useFactory: (repo: IRepositoryUser) => new UserUsecase(repo),
      inject: [IREPOSITORY_USER],
    },
  ],
  exports: [UserUsecase],
})
export class UserModule {}
