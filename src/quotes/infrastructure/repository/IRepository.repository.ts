import { Quote } from '../../domain/entities/quote.entity';

export interface IRepositoryQuote {
  create(entity: Quote): Promise<Quote>;
  findById(id: number): Promise<Quote | null>;
  findByEstablishmentId(establishmentId: number): Promise<Quote[]>;
  findActiveByEstablishmentId(establishmentId: number): Promise<Quote[]>;
  update(entity: Quote): Promise<Quote | null>;
  delete(id: number): Promise<void>;
}
