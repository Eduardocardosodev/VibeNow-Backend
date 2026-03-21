import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { QuoteUsecase } from './usecases/Quote.usecase';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quoteUsecase: QuoteUsecase) {}

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quoteUsecase.create(createQuoteDto);
  }

  /** Quotes ativas do estabelecimento (visíveis por 12h). Para exibir no app. */
  @Get('establishment/:establishmentId/active')
  findActiveByEstablishment(@Param('establishmentId') establishmentId: string) {
    return this.quoteUsecase.findActiveByEstablishmentId(+establishmentId);
  }

  /** Todas as quotes do estabelecimento (incluindo expiradas). Para o dono. */
  @Get('establishment/:establishmentId')
  findByEstablishment(@Param('establishmentId') establishmentId: string) {
    return this.quoteUsecase.findByEstablishmentId(+establishmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quoteUsecase.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuoteDto: UpdateQuoteDto) {
    return this.quoteUsecase.update(+id, updateQuoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quoteUsecase.delete(+id);
  }
}
