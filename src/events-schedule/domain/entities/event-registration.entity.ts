export class EventRegistration {
  constructor(
    public readonly id: number,
    public userId: number,
    public scheduledEventId: number,
    public createdAt: Date,
  ) {}
}
