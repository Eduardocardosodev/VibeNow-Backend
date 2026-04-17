export class Feedback {
  constructor(
    public readonly id: number,
    public userId: number,
    public establishmentId: number,
    public rating: number,
    public ratingCrowding: number,
    public ratingAnimation: number,
    public ratingOrganization: number,
    public ratingHygiene: number,
    public ratingAmbience: number,
    public comment: string | null,
    public photoUrl: string | null,
    public idempotencyKey: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
