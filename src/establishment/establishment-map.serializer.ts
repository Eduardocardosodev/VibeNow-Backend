import { Establishment } from './domain/entities/establishment.entity';

/** JSON enviado ao app no mapa (inclui distanceKm quando houver centro de ordenação). */
export type EstablishmentMapItemJson = {
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
  establishmentType: string;
  profilePhoto: string | null;
  latitude: number;
  longitude: number;
  score: number;
  openingHours: Establishment['openingHours'];
  createdAt: Date;
  updatedAt: Date;
  distanceKm?: number;
};

export function establishmentToMapJson(
  e: Establishment,
  distanceKm?: number,
): EstablishmentMapItemJson {
  const base: EstablishmentMapItemJson = {
    id: e.id,
    name: e.name,
    cnpj: e.cnpj,
    address: e.address,
    addressNumber: e.addressNumber,
    city: e.city,
    state: e.state,
    zipCode: e.zipCode,
    phone: e.phone,
    email: e.email,
    instagram: e.instagram,
    establishmentType: e.establishmentType,
    profilePhoto: e.profilePhoto,
    latitude: e.latitude,
    longitude: e.longitude,
    score: e.score,
    openingHours: e.openingHours,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
  if (distanceKm != null) {
    base.distanceKm = Math.round(distanceKm * 1000) / 1000;
  }
  return base;
}
