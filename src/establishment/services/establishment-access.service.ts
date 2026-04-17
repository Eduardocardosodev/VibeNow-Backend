import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterEstablishmentAndOwnerDto } from '../dto/register-establishment-and-owner.dto';
import { CreateEstablishmentEmployeeDto } from '../dto/create-establishment-employee.dto';
import { UserRole } from 'src/@shared/enums/userrole.enum';

export type EstablishmentSummary = {
  id: number;
  name: string;
  cnpj: string;
};

export type EmploymentSummary = {
  establishmentId: number;
  establishmentName: string;
  role: 'EMPLOYEE';
};

export type OwnerAccessSummary = {
  ownedEstablishments: EstablishmentSummary[];
  employments: EmploymentSummary[];
};

@Injectable()
export class EstablishmentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async isOwner(userId: number, establishmentId: number): Promise<boolean> {
    const row = await this.prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { ownerUserId: true },
    });
    return row?.ownerUserId === userId;
  }

  /** Dono ou funcionário ativo. */
  async isStaff(userId: number, establishmentId: number): Promise<boolean> {
    if (await this.isOwner(userId, establishmentId)) {
      return true;
    }
    const link = await this.prisma.establishmentEmployee.findFirst({
      where: { establishmentId, userId, active: true },
    });
    return link != null;
  }

  async getAccessSummary(userId: number): Promise<OwnerAccessSummary> {
    const owned = await this.prisma.establishment.findMany({
      where: { ownerUserId: userId },
      select: { id: true, name: true, cnpj: true },
      orderBy: { id: 'asc' },
    });

    const employments = await this.prisma.establishmentEmployee.findMany({
      where: { userId },
      include: {
        establishment: { select: { id: true, name: true } },
      },
      orderBy: { id: 'asc' },
    });

    return {
      ownedEstablishments: owned.map((e) => ({
        id: e.id,
        name: e.name,
        cnpj: e.cnpj,
      })),
      employments: employments.map((row) => ({
        establishmentId: row.establishment.id,
        establishmentName: row.establishment.name,
        role: 'EMPLOYEE' as const,
      })),
    };
  }

  /**
   * Cadastro self-service: estabelecimento + dono na mesma transação.
   * Login do portal: `email` e `password` (e-mail = e-mail de contacto do estabelecimento).
   */
  async registerEstablishmentAndOwner(dto: RegisterEstablishmentAndOwnerDto) {
    const [
      existingCnpj,
      existingEstEmail,
      existingIg,
      userByEmail,
      userByPhone,
    ] = await Promise.all([
      this.prisma.establishment.findUnique({ where: { cnpj: dto.cnpj } }),
      this.prisma.establishment.findUnique({ where: { email: dto.email } }),
      this.prisma.establishment.findUnique({
        where: { instagram: dto.instagram },
      }),
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { phone: dto.phone } }),
    ]);

    if (existingCnpj) {
      throw new BadRequestException('CNPJ já cadastrado.');
    }
    if (existingEstEmail) {
      throw new BadRequestException(
        'Este e-mail já está cadastrado para outro estabelecimento.',
      );
    }
    if (existingIg) {
      throw new BadRequestException('Instagram já cadastrado.');
    }
    if (userByEmail) {
      throw new ConflictException(
        'Este e-mail já está em uso por outra conta de utilizador.',
      );
    }
    if (userByPhone) {
      throw new ConflictException(
        'Este telefone já está em uso por outra conta de utilizador.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const ownerDisplayName =
      dto.ownerName?.trim() && dto.ownerName.trim().length >= 3
        ? dto.ownerName.trim()
        : dto.name;

    return this.prisma.$transaction(async (tx) => {
      const establishment = await tx.establishment.create({
        data: {
          name: dto.name,
          cnpj: dto.cnpj,
          address: dto.address,
          addressNumber: dto.addressNumber,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          phone: dto.phone,
          email: dto.email,
          instagram: dto.instagram,
          establishmentType: dto.establishmentType,
          profilePhoto: dto.profilePhoto ?? null,
          latitude: dto.latitude,
          longitude: dto.longitude,
          score: 0,
          openingHours: dto.openingHours ?? undefined,
        },
      });

      const user = await tx.user.create({
        data: {
          name: ownerDisplayName,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          role: UserRole.OWNER_ESTABLISHMENT,
        },
      });

      await tx.establishment.update({
        where: { id: establishment.id },
        data: { ownerUserId: user.id },
      });

      return { user, establishmentId: establishment.id };
    });
  }

  /** Dono cria login de funcionário (app mobile, rotas limitadas). */
  async createEmployee(
    ownerUserId: number,
    establishmentId: number,
    dto: CreateEstablishmentEmployeeDto,
  ) {
    const ok = await this.isOwner(ownerUserId, establishmentId);
    if (!ok) {
      throw new ForbiddenException(
        'Apenas o dono do estabelecimento pode criar funcionários.',
      );
    }

    const [byEmail, byPhone] = await Promise.all([
      dto.email
        ? this.prisma.user.findUnique({ where: { email: dto.email } })
        : null,
      this.prisma.user.findUnique({ where: { phone: dto.phone } }),
    ]);
    if (byEmail) {
      throw new ConflictException('E-mail já cadastrado.');
    }
    if (byPhone) {
      throw new ConflictException('Telefone já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email ?? null,
          phone: dto.phone,
          password: hashedPassword,
          role: UserRole.EMPLOYEE_ESTABLISHMENT,
          createdAt: now,
          updatedAt: now,
        },
      });
      await tx.establishmentEmployee.create({
        data: {
          establishmentId,
          userId: created.id,
        },
      });
      return created;
    });
  }

  async listEmployees(ownerUserId: number, establishmentId: number) {
    const ok = await this.isOwner(ownerUserId, establishmentId);
    if (!ok) {
      throw new ForbiddenException(
        'Apenas o dono do estabelecimento pode listar funcionários.',
      );
    }

    const links = await this.prisma.establishmentEmployee.findMany({
      where: { establishmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return links.map((link) => ({
      employeeLinkId: link.id,
      userId: link.user.id,
      name: link.user.name,
      phone: link.user.phone,
      email: link.user.email,
      active: link.active,
      linkedAt: link.createdAt,
      userCreatedAt: link.user.createdAt,
    }));
  }

  async getEmployee(
    ownerUserId: number,
    establishmentId: number,
    userId: number,
  ) {
    const ok = await this.isOwner(ownerUserId, establishmentId);
    if (!ok) {
      throw new ForbiddenException(
        'Apenas o dono do estabelecimento pode ver detalhes do funcionário.',
      );
    }

    const link = await this.prisma.establishmentEmployee.findFirst({
      where: { establishmentId, userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!link) {
      throw new NotFoundException(
        'Funcionário não encontrado neste estabelecimento.',
      );
    }

    return {
      employeeLinkId: link.id,
      userId: link.user.id,
      name: link.user.name,
      phone: link.user.phone,
      email: link.user.email,
      role: link.user.role,
      active: link.active,
      linkedAt: link.createdAt,
      userCreatedAt: link.user.createdAt,
      userUpdatedAt: link.user.updatedAt,
    };
  }

  async setEmployeeActive(
    ownerUserId: number,
    establishmentId: number,
    userId: number,
    active: boolean,
  ) {
    const ok = await this.isOwner(ownerUserId, establishmentId);
    if (!ok) {
      throw new ForbiddenException(
        'Apenas o dono do estabelecimento pode alterar o acesso de funcionários.',
      );
    }

    const link = await this.prisma.establishmentEmployee.findFirst({
      where: { establishmentId, userId },
    });
    if (!link) {
      throw new NotFoundException(
        'Funcionário não encontrado neste estabelecimento.',
      );
    }

    const updated = await this.prisma.establishmentEmployee.update({
      where: { id: link.id },
      data: { active },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return {
      employeeLinkId: updated.id,
      userId: updated.user.id,
      name: updated.user.name,
      phone: updated.user.phone,
      email: updated.user.email,
      active: updated.active,
      linkedAt: updated.createdAt,
    };
  }

  async removeEmployee(
    ownerUserId: number,
    establishmentId: number,
    userId: number,
  ) {
    const ok = await this.isOwner(ownerUserId, establishmentId);
    if (!ok) {
      throw new ForbiddenException(
        'Apenas o dono do estabelecimento pode remover funcionários.',
      );
    }

    const link = await this.prisma.establishmentEmployee.findFirst({
      where: { establishmentId, userId },
    });
    if (!link) {
      throw new NotFoundException(
        'Funcionário não encontrado neste estabelecimento.',
      );
    }

    await this.prisma.establishmentEmployee.delete({
      where: { id: link.id },
    });
  }
}
