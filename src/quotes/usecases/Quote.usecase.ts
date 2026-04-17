import { NotFoundException } from '@nestjs/common';
import { Quote } from '../domain/entities/quote.entity';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { IRepositoryQuote } from '../infrastructure/repository/IRepository.repository';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';

const QUOTE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 horas

export class QuoteUsecase {
  constructor(
    private readonly quoteRepository: IRepositoryQuote,
    private readonly establishmentRepository: IRepositoryEstablishment,
  ) {}

  async create(data: CreateQuoteDto): Promise<Quote> {
    const establishment = await this.establishmentRepository.findById(
      data.establishmentId,
    );
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + QUOTE_DURATION_MS);
    const quote = new Quote(
      0,
      data.establishmentId,
      data.text.trim(),
      expiresAt,
      now,
    );
    return this.quoteRepository.create(quote);
  }

  async findById(id: number): Promise<Quote> {
    const quote = await this.quoteRepository.findById(id);
    if (!quote) {
      throw new NotFoundException('Frase não encontrada.');
    }
    return quote;
  }

  /** Quotes ativos do estabelecimento (expiresAt > now). Para exibir no app. */
  async findActiveByEstablishmentId(establishmentId: number): Promise<Quote[]> {
    return this.quoteRepository.findActiveByEstablishmentId(establishmentId);
  }

  /** Todas as quotes do estabelecimento (incluindo expiradas). Para o dono. */
  async findByEstablishmentId(establishmentId: number): Promise<Quote[]> {
    return this.quoteRepository.findByEstablishmentId(establishmentId);
  }

  async update(id: number, data: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.quoteRepository.findById(id);
    if (!quote) {
      throw new NotFoundException('Frase não encontrada.');
    }
    const updated = new Quote(
      quote.id,
      data.establishmentId ?? quote.establishmentId,
      (data.text ?? quote.text).trim(),
      quote.expiresAt,
      quote.createdAt,
    );
    const result = await this.quoteRepository.update(updated);
    if (!result) throw new NotFoundException('Frase não encontrada.');
    return result;
  }

  async delete(id: number): Promise<void> {
    const quote = await this.quoteRepository.findById(id);
    if (!quote) {
      throw new NotFoundException('Frase não encontrada.');
    }
    await this.quoteRepository.delete(id);
  }
}
