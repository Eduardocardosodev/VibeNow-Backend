import { UserRole } from 'src/@shared/enums/userrole.enum';

export class User {
  constructor(
    public readonly id: number,
    public name: string,
    public phone: string,
    public password: string,
    public role: UserRole,
    public createdAt: Date,
    public updatedAt: Date,
    public email?: string | null,
    public dateOfBirth?: Date | null,
    public acceptedTermsOfUse: boolean = false,
    public acceptedPrivacyPolicy: boolean = false,
  ) {}
}
