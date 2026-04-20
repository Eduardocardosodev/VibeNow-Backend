import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Establishment,
  OpeningHoursMap,
} from '../../domain/entities/establishment.entity';
import { DEFAULT_OPERATING_TIME_ZONE } from 'src/@shared/utils/resolve-operating-period-utc';
import { IRepositoryEstablishment } from './IRepository.repository';
import {
  approximateBoundingBoxForRadiusKm,
  haversineDistanceKm,
} from '../../utils/haversine.util';

type PrismaEstablishmentRow = {
  id: number;
  name: string;
  cnpj: string;
  address: string;
  addressNumber: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  instagram: string;
  establishmentType: 'LOUNGE' | 'PARTY';
  profilePhoto: string | null;
  latitude: number;
  longitude: number;
  score: number;
  openingHours?: unknown;
  operatingTimeZone?: string;
  ownerUserId?: number | null;
  feedbackRewardEnabled?: boolean;
  feedbackRewardMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaEstablishmentRepository implements IRepositoryEstablishment {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaEstablishmentRow): Establishment {
    const openingHours =
      row.openingHours != null &&
      typeof row.openingHours === 'object' &&
      !Array.isArray(row.openingHours)
        ? (row.openingHours as OpeningHoursMap)
        : null;
    return new Establishment(
      row.id,
      row.name,
      row.cnpj,
      row.address,
      row.addressNumber,
      row.city,
      row.state,
      row.zipCode,
      row.phone,
      row.email,
      row.instagram,
      row.establishmentType,
      row.profilePhoto,
      row.latitude,
      row.longitude,
      row.score,
      openingHours,
      row.operatingTimeZone ?? DEFAULT_OPERATING_TIME_ZONE,
      row.ownerUserId ?? null,
      row.feedbackRewardEnabled ?? false,
      row.feedbackRewardMessage ?? null,
      row.createdAt,
      row.updatedAt,
    );
  }

  async create(entity: Establishment): Promise<Establishment> {
    const data = {
      name: entity.name,
      cnpj: entity.cnpj,
      address: entity.address,
      addressNumber: entity.addressNumber,
      city: entity.city,
      state: entity.state,
      zipCode: entity.zipCode,
      phone: entity.phone,
      email: entity.email,
      instagram: entity.instagram,
      establishmentType: entity.establishmentType,
      profilePhoto: entity.profilePhoto,
      latitude: entity.latitude,
      longitude: entity.longitude,
      score: entity.score,
      openingHours: entity.openingHours ?? undefined,
      operatingTimeZone: entity.operatingTimeZone,
      ownerUserId: entity.ownerUserId ?? undefined,
      feedbackRewardEnabled: entity.feedbackRewardEnabled,
      feedbackRewardMessage: entity.feedbackRewardMessage ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    const establishment = await this.prisma.establishment.create({
      data: data as Parameters<
        PrismaService['establishment']['create']
      >[0]['data'],
    });
    return this.toDomain(establishment as PrismaEstablishmentRow);
  }

  async findByCnpj(cnpj: string): Promise<Establishment | null> {
    const row = await this.prisma.establishment.findUnique({
      where: { cnpj },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<Establishment | null> {
    const row = await this.prisma.establishment.findUnique({
      where: { email },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Establishment[]> {
    const rows = await this.prisma.establishment.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => this.toDomain(row as PrismaEstablishmentRow));
  }

  async findById(id: number): Promise<Establishment | null> {
    const row = await this.prisma.establishment.findUnique({
      where: { id },
    });
    return row ? this.toDomain(row as PrismaEstablishmentRow) : null;
  }

  async findInBoundingBox(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    take: number,
  ): Promise<Establishment[]> {
    const rows = await this.prisma.establishment.findMany({
      where: {
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
      },
      take,
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => this.toDomain(row as PrismaEstablishmentRow));
  }

  async findNear(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Establishment[]> {
    const box = approximateBoundingBoxForRadiusKm(
      latitude,
      longitude,
      radiusKm,
    );
    const candidates = await this.findInBoundingBox(
      box.minLat,
      box.maxLat,
      box.minLng,
      box.maxLng,
      5000,
    );
    const withDistance = candidates
      .map((e) => ({
        e,
        distanceKm: haversineDistanceKm(
          latitude,
          longitude,
          e.latitude,
          e.longitude,
        ),
      }))
      .filter((x) => x.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    return withDistance.map((x) => x.e);
  }

  async update(entity: Establishment): Promise<Establishment | null> {
    const data = {
      name: entity.name,
      cnpj: entity.cnpj,
      address: entity.address,
      addressNumber: entity.addressNumber,
      city: entity.city,
      state: entity.state,
      zipCode: entity.zipCode,
      phone: entity.phone,
      email: entity.email,
      instagram: entity.instagram,
      establishmentType: entity.establishmentType,
      profilePhoto: entity.profilePhoto,
      latitude: entity.latitude,
      longitude: entity.longitude,
      score: entity.score,
      openingHours: entity.openingHours ?? undefined,
      operatingTimeZone: entity.operatingTimeZone,
      ownerUserId: entity.ownerUserId ?? undefined,
      feedbackRewardEnabled: entity.feedbackRewardEnabled,
      feedbackRewardMessage: entity.feedbackRewardMessage ?? undefined,
      updatedAt: entity.updatedAt,
    };
    const row = await this.prisma.establishment.update({
      where: { id: entity.id },
      data: data as Parameters<
        PrismaService['establishment']['update']
      >[0]['data'],
    });
    return row ? this.toDomain(row as PrismaEstablishmentRow) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.establishment.delete({
      where: { id },
    });
  }
}
