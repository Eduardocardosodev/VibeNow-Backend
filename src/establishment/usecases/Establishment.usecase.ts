import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Establishment } from '../domain/entities/establishment.entity';
import { CreateEstablishmentDto } from '../dto/create-establishment.dto';
import { MapBoundsQueryDto } from '../dto/map-bounds-query.dto';
import { UpdateEstablishmentDto } from '../dto/update-establishment.dto';
import { UpdateFeedbackRewardDto } from '../dto/update-feedback-reward.dto';
import {
  establishmentToMapJson,
  EstablishmentMapItemJson,
} from '../establishment-map.serializer';
import { IRepositoryEstablishment } from '../infrastructure/repository/IRepository.repository';
import { haversineDistanceKm } from '../utils/haversine.util';

/** Largura máxima do retângulo (graus) — evita full table scan disfarçado. */
const MAX_MAP_BOUNDS_SPAN_DEG = 8;
const DEFAULT_MAP_LIMIT = 120;
const MAX_MAP_LIMIT = 250;
const MAX_FETCH_FOR_DISTANCE_SORT = 500;

export class EstablishmentUsecase {
  constructor(
    private readonly establishmentRepository: IRepositoryEstablishment,
  ) {}

  async execute(data: CreateEstablishmentDto): Promise<Establishment> {
    const existingByCnpj = await this.establishmentRepository.findByCnpj(
      data.cnpj,
    );
    if (existingByCnpj) {
      throw new BadRequestException(
        'Já existe um estabelecimento com este CNPJ.',
      );
    }

    const existingByEmail = await this.establishmentRepository.findByEmail(
      data.email,
    );
    if (existingByEmail) {
      throw new BadRequestException(
        'Já existe um estabelecimento com este e-mail.',
      );
    }

    const now = new Date();
    const establishment = new Establishment(
      0,
      data.name,
      data.cnpj,
      data.address,
      data.addressNumber,
      data.city,
      data.state,
      data.zipCode,
      data.phone,
      data.email,
      data.instagram,
      data.establishmentType,
      data.profilePhoto ?? null,
      data.latitude,
      data.longitude,
      0,
      data.openingHours ?? null,
      null,
      false,
      null,
      now,
      now,
    );

    return await this.establishmentRepository.create(establishment);
  }

  async findNear(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Establishment[]> {
    return await this.establishmentRepository.findNear(
      latitude,
      longitude,
      radiusKm,
    );
  }

  /**
   * Estabelecimentos dentro do retângulo visível do mapa (filtro no Postgres).
   * Opcionalmente ordena por distância a partir de `centerLat`/`centerLng`.
   */
  async findInMapBounds(
    query: MapBoundsQueryDto,
  ): Promise<EstablishmentMapItemJson[]> {
    const minLat = Math.min(query.swLat, query.neLat);
    const maxLat = Math.max(query.swLat, query.neLat);
    const minLng = Math.min(query.swLng, query.neLng);
    const maxLng = Math.max(query.swLng, query.neLng);

    if (maxLat - minLat > MAX_MAP_BOUNDS_SPAN_DEG) {
      throw new BadRequestException(
        'Latitude: área do mapa muito grande. Aproxime o zoom (máx. ~8°).',
      );
    }
    if (maxLng - minLng > MAX_MAP_BOUNDS_SPAN_DEG) {
      throw new BadRequestException(
        'Longitude: área do mapa muito grande. Aproxime o zoom (máx. ~8°).',
      );
    }

    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_MAP_LIMIT, 1),
      MAX_MAP_LIMIT,
    );

    const hasCenter =
      query.centerLat != null &&
      query.centerLng != null &&
      Number.isFinite(query.centerLat) &&
      Number.isFinite(query.centerLng);

    const fetchCap = hasCenter
      ? Math.min(MAX_FETCH_FOR_DISTANCE_SORT, Math.max(limit * 4, limit))
      : limit;

    const list = await this.establishmentRepository.findInBoundingBox(
      minLat,
      maxLat,
      minLng,
      maxLng,
      fetchCap,
    );

    if (!hasCenter) {
      return list.slice(0, limit).map((e) => establishmentToMapJson(e));
    }

    const centerLat = query.centerLat as number;
    const centerLng = query.centerLng as number;

    const sorted = list
      .map((e) => ({
        e,
        distanceKm: haversineDistanceKm(
          centerLat,
          centerLng,
          e.latitude,
          e.longitude,
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return sorted.map(({ e, distanceKm }) =>
      establishmentToMapJson(e, distanceKm),
    );
  }

  async findAll(): Promise<Establishment[]> {
    const establishments = await this.establishmentRepository.findAll();
    if (establishments.length === 0) {
      throw new NotFoundException('Nenhum estabelecimento encontrado.');
    }
    return establishments;
  }

  async findById(id: number): Promise<Establishment> {
    const establishment = await this.establishmentRepository.findById(id);
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    return establishment;
  }

  async update(
    id: number,
    data: UpdateEstablishmentDto,
  ): Promise<Establishment | null> {
    const establishment = await this.establishmentRepository.findById(id);
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }

    if (data.cnpj != null && data.cnpj !== establishment.cnpj) {
      const existingByCnpj = await this.establishmentRepository.findByCnpj(
        data.cnpj,
      );
      if (existingByCnpj) {
        throw new BadRequestException(
          'Já existe um estabelecimento com este CNPJ.',
        );
      }
    }

    if (data.email != null && data.email !== establishment.email) {
      const existingByEmail = await this.establishmentRepository.findByEmail(
        data.email,
      );
      if (existingByEmail) {
        throw new BadRequestException(
          'Já existe um estabelecimento com este e-mail.',
        );
      }
    }

    const now = new Date();
    const openingHours =
      data.openingHours !== undefined
        ? data.openingHours
        : establishment.openingHours;
    return await this.establishmentRepository.update(
      new Establishment(
        establishment.id,
        data.name ?? establishment.name,
        data.cnpj ?? establishment.cnpj,
        data.address ?? establishment.address,
        data.addressNumber ?? establishment.addressNumber,
        data.city ?? establishment.city,
        data.state ?? establishment.state,
        data.zipCode ?? establishment.zipCode,
        data.phone ?? establishment.phone,
        data.email ?? establishment.email,
        data.instagram ?? establishment.instagram,
        data.establishmentType ?? establishment.establishmentType,
        data.profilePhoto !== undefined
          ? data.profilePhoto
          : establishment.profilePhoto,
        data.latitude ?? establishment.latitude,
        data.longitude ?? establishment.longitude,
        data.score ?? establishment.score,
        openingHours ?? null,
        establishment.ownerUserId,
        establishment.feedbackRewardEnabled,
        establishment.feedbackRewardMessage,
        establishment.createdAt,
        now,
      ),
    );
  }

  async getFeedbackRewardSettings(establishmentId: number) {
    const establishment =
      await this.establishmentRepository.findById(establishmentId);
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    return {
      enabled: establishment.feedbackRewardEnabled,
      message: establishment.feedbackRewardMessage,
    };
  }

  async updateFeedbackReward(
    establishmentId: number,
    dto: UpdateFeedbackRewardDto,
  ): Promise<{ enabled: boolean; message: string | null }> {
    const establishment =
      await this.establishmentRepository.findById(establishmentId);
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    const now = new Date();
    const enabled =
      dto.enabled !== undefined
        ? dto.enabled
        : establishment.feedbackRewardEnabled;
    const message =
      dto.message !== undefined
        ? dto.message
        : establishment.feedbackRewardMessage;
    const updated = await this.establishmentRepository.update(
      new Establishment(
        establishment.id,
        establishment.name,
        establishment.cnpj,
        establishment.address,
        establishment.addressNumber,
        establishment.city,
        establishment.state,
        establishment.zipCode,
        establishment.phone,
        establishment.email,
        establishment.instagram,
        establishment.establishmentType,
        establishment.profilePhoto,
        establishment.latitude,
        establishment.longitude,
        establishment.score,
        establishment.openingHours,
        establishment.ownerUserId,
        enabled,
        message,
        establishment.createdAt,
        now,
      ),
    );
    if (!updated) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    return {
      enabled: updated.feedbackRewardEnabled,
      message: updated.feedbackRewardMessage,
    };
  }

  async delete(id: number): Promise<void> {
    const establishment = await this.establishmentRepository.findById(id);
    if (!establishment) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    return await this.establishmentRepository.delete(id);
  }
}
