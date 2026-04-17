import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/@shared/enums/userrole.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { IRepositoryUser } from './IRepository.repository';

function toDomain(row: {
  id: number;
  name: string;
  phone: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  email: string | null;
  dateOfBirth: Date | null;
  acceptedTermsOfUse: boolean;
  acceptedPrivacyPolicy: boolean;
}): User {
  return new User(
    row.id,
    row.name,
    row.phone,
    row.password,
    row.role as UserRole,
    row.createdAt,
    row.updatedAt,
    row.email,
    row.dateOfBirth,
    row.acceptedTermsOfUse,
    row.acceptedPrivacyPolicy,
  );
}

@Injectable()
export class PrismaUserRepository implements IRepositoryUser {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    return user ? toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? toDomain(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
    return users.map(toDomain);
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? toDomain(user) : null;
  }

  async create(entity: User): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        password: entity.password,
        role: entity.role,
        dateOfBirth: entity.dateOfBirth,
        acceptedTermsOfUse: entity.acceptedTermsOfUse,
        acceptedPrivacyPolicy: entity.acceptedPrivacyPolicy,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });
    return toDomain(user);
  }

  async update(entity: User): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: entity.id },
      data: {
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        password: entity.password,
        role: entity.role,
        dateOfBirth: entity.dateOfBirth,
        acceptedTermsOfUse: entity.acceptedTermsOfUse,
        acceptedPrivacyPolicy: entity.acceptedPrivacyPolicy,
        updatedAt: entity.updatedAt,
      },
    });
    return toDomain(user);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
