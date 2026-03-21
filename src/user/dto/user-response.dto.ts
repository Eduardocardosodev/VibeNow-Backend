import { User } from '../domain/entities/user.entity';

/** Objeto seguro para retorno nas rotas (sem password) */
export type UserResponse = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
