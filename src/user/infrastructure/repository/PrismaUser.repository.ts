import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { IRepositoryUser } from './IRepository.repository';

@Injectable()
export class PrismaUserRepository implements IRepositoryUser {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });
    return user
      ? new User(
          user.id,
          user.name,
          user.phone,
          user.password,
          user.createdAt,
          user.updatedAt,
          user.email,
        )
      : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user
      ? new User(
          user.id,
          user.name,
          user.phone,
          user.password,
          user.createdAt,
          user.updatedAt,
          user.email,
        )
      : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'asc' },
    });
    return users.map(
      (user) =>
        new User(
          user.id,
          user.name,
          user.phone,
          user.password,
          user.createdAt,
          user.updatedAt,
          user.email,
        ),
    );
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user
      ? new User(
          user.id,
          user.name,
          user.phone,
          user.password,
          user.createdAt,
          user.updatedAt,
          user.email,
        )
      : null;
  }

  async create(entity: User): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        password: entity.password,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });
    return new User(
      user.id,
      user.name,
      user.phone,
      user.password,
      user.createdAt,
      user.updatedAt,
      user.email,
    );
  }

  async update(entity: User): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        password: entity.password,
        updatedAt: entity.updatedAt,
      },
    });
    return new User(
      user.id,
      user.name,
      user.phone,
      user.password,
      user.createdAt,
      user.updatedAt,
      user.email,
    );
  }
  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
