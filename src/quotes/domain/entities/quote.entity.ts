export class Quote {
  constructor(
    public readonly id: number,
    public establishmentId: number,
    public text: string,
    public expiresAt: Date,
    public createdAt: Date,
  ) {}
}
