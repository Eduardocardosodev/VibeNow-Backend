export type EventListType = 'GENERAL' | 'FREE_LIST' | 'FRIEND_LIST' | 'VIP';

export const EVENT_LIST_TYPES: EventListType[] = [
  'GENERAL',
  'FREE_LIST',
  'FRIEND_LIST',
  'VIP',
];

export class ScheduledEvent {
  constructor(
    public readonly id: number,
    public establishmentId: number,
    public name: string,
    public description: string | null,
    public attractions: string | null,
    public dj: string | null,
    public priceInfo: string | null,
    public eventStartsAt: Date,
    public eventEndsAt: Date | null,
    public listType: EventListType,
    public posterImageUrl: string | null,
    public offersTableReservation: boolean,
    public tablePeopleCapacity: number | null,
    public tablesAvailable: number | null,
    public tablePrice: number | null,
    public offersBoothReservation: boolean,
    public boothPeopleCapacity: number | null,
    public boothsAvailable: number | null,
    public boothPrice: number | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
