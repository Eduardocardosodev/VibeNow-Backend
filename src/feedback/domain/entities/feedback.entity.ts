export class Feedback {
  constructor(
    public readonly id: number,
    public userId: number,
    public establishmentId: number,
    public rating: number,
    public comment: string | null,
    public photoUrl: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
