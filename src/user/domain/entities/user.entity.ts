export class User {
  constructor(
    public readonly id: number,
    public name: string,
    public phone: string,
    public password: string,
    public createdAt: Date,
    public updatedAt: Date,
    public email?: string | null,
  ) {}
}
