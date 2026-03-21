import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '../domain/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { IRepositoryUser } from '../infrastructure/repository/IRepository.repository';
import * as bcrypt from 'bcryptjs';

export class UserUsecase {
  constructor(private readonly userRepository: IRepositoryUser) {}

  async execute(data: CreateUserDto): Promise<User> {
    const now = new Date();
    const user = await this.userRepository.findByPhone(data.phone);
    if (user) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = bcrypt.hashSync(data.password, 10);

    return await this.userRepository.create(
      new User(0, data.name, data.phone, hashedPassword, now, now, data.email),
    );
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.findAll();
    if (users.length === 0) {
      throw new NotFoundException('Users not found');
    }
    return users;
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, data: UpdateUserDto): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const now = new Date();
    return await this.userRepository.update(
      new User(
        user.id,
        data.name ?? user.name,
        data.phone ?? user.phone,
        data.password ?? user.password,
        user.createdAt,
        now,
        data.email ?? user.email,
      ),
    );
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.userRepository.delete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
