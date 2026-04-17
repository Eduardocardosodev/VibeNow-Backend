import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/@shared/enums/userrole.enum';
import { User } from '../domain/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { IRepositoryUser } from '../infrastructure/repository/IRepository.repository';
import * as bcrypt from 'bcryptjs';

export class UserUsecase {
  constructor(private readonly userRepository: IRepositoryUser) {}

  async execute(data: CreateUserDto): Promise<User> {
    const now = new Date();

    if (!data.acceptedTermsOfUse) {
      throw new BadRequestException(
        'É necessário aceitar os Termos de Uso para se cadastrar.',
      );
    }
    if (!data.acceptedPrivacyPolicy) {
      throw new BadRequestException(
        'É necessário aceitar a Política de Privacidade para se cadastrar.',
      );
    }

    const dateOfBirth = new Date(data.dateOfBirth);
    if (isNaN(dateOfBirth.getTime())) {
      throw new BadRequestException('Data de nascimento inválida.');
    }

    const age = this.calculateAge(dateOfBirth, now);
    if (age < 18) {
      throw new BadRequestException(
        'Você precisa ter pelo menos 18 anos para se cadastrar.',
      );
    }

    const user = await this.userRepository.findByPhone(data.phone);
    if (user) {
      throw new BadRequestException('Usuário já existe');
    }

    const hashedPassword = bcrypt.hashSync(data.password, 10);

    return await this.userRepository.create(
      new User(
        0,
        data.name,
        data.phone,
        hashedPassword,
        UserRole.NORMAL_USER,
        now,
        now,
        data.email,
        dateOfBirth,
        data.acceptedTermsOfUse,
        data.acceptedPrivacyPolicy,
      ),
    );
  }

  private calculateAge(birthDate: Date, referenceDate: Date): number {
    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.findAll();
    if (users.length === 0) {
      throw new NotFoundException('Nenhum usuário encontrado.');
    }
    return users;
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async update(id: number, data: UpdateUserDto): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    const now = new Date();
    const nextPassword =
      data.password != null && data.password !== ''
        ? bcrypt.hashSync(data.password, 10)
        : user.password;

    return await this.userRepository.update(
      new User(
        user.id,
        data.name ?? user.name,
        data.phone ?? user.phone,
        nextPassword,
        user.role,
        user.createdAt,
        now,
        data.email ?? user.email,
        user.dateOfBirth,
        user.acceptedTermsOfUse,
        user.acceptedPrivacyPolicy,
      ),
    );
  }

  async delete(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return await this.userRepository.delete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  /** Login — não lança se não existir. */
  async findByPhoneOrNull(phone: string): Promise<User | null> {
    return await this.userRepository.findByPhone(phone);
  }

  async findByEmailOrNull(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }
}
