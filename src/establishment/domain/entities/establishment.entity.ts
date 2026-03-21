export type EstablishmentType = 'LOUNGE' | 'PARTY';

/** Dia da semana em inglês (padrão da API). */
export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/** Horário de um dia: open/close no formato "HH:mm". null = fechado. */
export type DayHours = { open: string; close: string } | null;

/** Horário de funcionamento: um por dia. Chaves em inglês. */
export type OpeningHoursMap = Partial<Record<DayKey, DayHours>>;

export class Establishment {
  constructor(
    public readonly id: number,
    public name: string,
    public cnpj: string,
    public address: string,
    public city: string,
    public state: string,
    public zipCode: string,
    public phone: string,
    public email: string,
    public instagram: string,
    public establishmentType: EstablishmentType,
    public profilePhoto: string | null,
    public latitude: number,
    public longitude: number,
    public score: number,
    public openingHours: OpeningHoursMap | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
