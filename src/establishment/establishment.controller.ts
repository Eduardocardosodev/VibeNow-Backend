import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EstablishmentUsecase } from './usecases/Establishment.usecase';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { NearQueryDto } from './dto/near-query.dto';
import { MapBoundsQueryDto } from './dto/map-bounds-query.dto';

@Controller('establishments')
export class EstablishmentController {
  constructor(private readonly establishmentUsecase: EstablishmentUsecase) {}

  @Post()
  create(@Body() createEstablishmentDto: CreateEstablishmentDto) {
    return this.establishmentUsecase.execute(createEstablishmentDto);
  }

  @Get()
  findAll() {
    return this.establishmentUsecase.findAll();
  }

  @Get('near')
  findNear(@Query() query: NearQueryDto) {
    const radiusKm = query.radiusKm ?? 10;
    return this.establishmentUsecase.findNear(query.lat, query.lng, radiusKm);
  }

  /**
   * Mapa: só estabelecimentos dentro da área visível (bounding box).
   * Use `centerLat`/`centerLng` (ex.: GPS) para ordenar por distância e receber `distanceKm`.
   */
  @Get('map-bounds')
  findInMapBounds(@Query() query: MapBoundsQueryDto) {
    return this.establishmentUsecase.findInMapBounds(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.establishmentUsecase.findById(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEstablishmentDto: UpdateEstablishmentDto,
  ) {
    return this.establishmentUsecase.update(+id, updateEstablishmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.establishmentUsecase.delete(+id);
  }
}
