import { UserRole } from 'src/@shared/enums/userrole.enum';
import { User } from '../domain/entities/user.entity';

/** Objeto seguro para retorno nas rotas (sem password) */
export type UserResponse = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  dateOfBirth?: Date | null;
  acceptedTermsOfUse: boolean;
  acceptedPrivacyPolicy: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    dateOfBirth: user.dateOfBirth,
    acceptedTermsOfUse: user.acceptedTermsOfUse,
    acceptedPrivacyPolicy: user.acceptedPrivacyPolicy,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
