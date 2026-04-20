import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { parseIdempotencyKey } from 'src/feedback/utils/parse-idempotency-key';
import { OrdersUsecase } from '../usecases/orders.usecase';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderListQueryDto } from '../dto/order-list-query.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersUsecase: OrdersUsecase) {}

  /**
   * Cliente final: cria pedido. Header `Idempotency-Key` obrigatório (UUID por tentativa);
   * retries com a mesma chave devolvem **200** + mesmo pedido sem duplicar.
   */
  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('idempotency-key') idempotencyKeyHeader?: string | string[],
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    const idempotencyKey = parseIdempotencyKey(idempotencyKeyHeader);
    const { order, replay } = await this.ordersUsecase.create(
      userId,
      dto,
      idempotencyKey,
    );
    res.status(replay ? 200 : 201);
    return order;
  }

  /**
   * Detalhe de um pedido do utilizador (itens com subtotal, total, estabelecimento
   * para mapa/contacto). Só devolve se `orderId` pertencer ao JWT.
   */
  @Get('me/:orderId')
  getMineById(
    @Req() req: Request,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.ordersUsecase.getMineById(userId, orderId);
  }

  /** Histórico de pedidos do utilizador autenticado. */
  @Get('me')
  listMine(@Req() req: Request, @Query() query: OrderListQueryDto) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.ordersUsecase.listMine(userId, query);
  }
}
