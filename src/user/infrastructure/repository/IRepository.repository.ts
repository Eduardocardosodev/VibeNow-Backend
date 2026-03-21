import { User } from 'src/user/domain/entities/user.entity';

export interface IRepositoryUser {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  create(entity: User): Promise<User>;
  update(entity: User): Promise<User | null>;
  delete(id: number): Promise<void>;
}
