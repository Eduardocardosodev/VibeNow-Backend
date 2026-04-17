import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { OrdersUsecase } from '../usecases/orders.usecase';
import { OrderListQueryDto } from '../dto/order-list-query.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { EstablishmentStaffGuard } from 'src/@shared/guards/establishment-staff.guard';
import { RequireEstablishmentStaff } from 'src/@shared/decorators/require-establishment-staff.decorator';

/**
 * Painel do estabelecimento: lista pedidos e atualiza status.
 * Prefixo `establishments` (mesmo padrão do mapa / detalhe).
 */
@Controller('establishments')
export class EstablishmentOrdersPanelController {
  constructor(private readonly ordersUsecase: OrdersUsecase) {}

  @Get(':establishmentId/orders')
  @UseGuards(EstablishmentStaffGuard)
  @RequireEstablishmentStaff('establishmentId')
  listForPanel(
    @Param('establishmentId') establishmentId: string,
    @Query() query: OrderListQueryDto,
    @Req() req: Request,
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.ordersUsecase.listForEstablishment(
      userId,
      +establishmentId,
      query,
    );
  }

  @Patch(':establishmentId/orders/:orderId/status')
  @UseGuards(EstablishmentStaffGuard)
  @RequireEstablishmentStaff('establishmentId')
  updateStatus(
    @Param('establishmentId') establishmentId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    return this.ordersUsecase.updateStatus(
      userId,
      +establishmentId,
      +orderId,
      dto.status,
    );
  }
}
