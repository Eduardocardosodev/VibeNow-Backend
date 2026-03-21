import { Establishment } from '../../domain/entities/establishment.entity';

export interface IRepositoryEstablishment {
  findByCnpj(cnpj: string): Promise<Establishment | null>;
  findByEmail(email: string): Promise<Establishment | null>;
  findAll(): Promise<Establishment[]>;
  findById(id: number): Promise<Establishment | null>;
  findNear(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Establishment[]>;
  /** Filtro no banco por retângulo (mapa); `take` = máximo de linhas retornadas. */
  findInBoundingBox(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    take: number,
  ): Promise<Establishment[]>;
  create(entity: Establishment): Promise<Establishment>;
  update(entity: Establishment): Promise<Establishment | null>;
  delete(id: number): Promise<void>;
}
