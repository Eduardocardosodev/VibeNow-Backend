import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { EstablishmentAccessService } from 'src/establishment/services/establishment-access.service';
import { RegisterEstablishmentAndOwnerDto } from 'src/establishment/dto/register-establishment-and-owner.dto';
import { User } from 'src/user/domain/entities/user.entity';
import { UserUsecase } from 'src/user/usecases/User.usecase';
import { toUserResponse } from 'src/user/dto/user-response.dto';
import { LoginDto, LoginEmailDto } from './dto/auth.dto';

/** Access token curto; refresh JWT longo — ambos stateless (nada no banco). */
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES ?? '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES ?? '7d';

@Injectable()
export class AuthUsecase {
  constructor(
    private readonly userUsecase: UserUsecase,
    private readonly jwtService: JwtService,
    private readonly establishmentAccess: EstablishmentAccessService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.userUsecase.findByPhoneOrNull(data.phone);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.issueTokenPair(user);
  }

  /** Portal web do estabelecimento (e-mail + senha). */
  async loginWithEmail(data: LoginEmailDto) {
    const user = await this.userUsecase.findByEmailOrNull(data.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.issueTokenPair(user);
  }

  /** Cadastro self-service: cria estabelecimento + dono; login com e-mail e senha do body. */
  async registerEstablishmentAndOwner(dto: RegisterEstablishmentAndOwnerDto) {
    const { user: created, establishmentId } =
      await this.establishmentAccess.registerEstablishmentAndOwner(dto);
    const user = await this.userUsecase.findById(created.id);
    return {
      ...this.issueTokenPair(user),
      user: toUserResponse(user),
      establishmentId,
    };
  }

  /** Perfil + visões (dono / funcionário) para o app ou portal. */
  async getMeWithAccess(userId: number) {
    const user = await this.userUsecase.findById(userId);
    const access = await this.establishmentAccess.getAccessSummary(userId);
    return {
      user: toUserResponse(user),
      access,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException('Refresh token é obrigatório.');
    }

    const refreshSecret = this.getRefreshSecret();
    let payload: { sub?: string | number; typ?: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string | number;
        typ: string;
      }>(refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const userId =
      typeof payload.sub === 'number' ? payload.sub : Number(payload.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const user = await this.userUsecase.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return this.issueTokenPair(user);
  }

  private issueTokenPair(user: User) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user.id);
    const accessExpiresInSec = this.parseExpiresToSeconds(ACCESS_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresInSec,
      tokenType: 'Bearer' as const,
    };
  }

  private generateAccessToken(user: Partial<User>) {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload, {
      expiresIn: ACCESS_EXPIRES_IN,
    } as JwtSignOptions);
  }

  /** JWT de refresh: assinado com segredo próprio (nunca igual ao do access). */
  private generateRefreshToken(userId: number): string {
    const opts = {
      secret: this.getRefreshSecret(),
      expiresIn: REFRESH_EXPIRES_IN,
    } as JwtSignOptions;
    return this.jwtService.sign({ sub: userId, typ: 'refresh' }, opts);
  }

  private getRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret?.trim()) {
      throw new InternalServerErrorException(
        'JWT_REFRESH_SECRET não está configurado.',
      );
    }
    return secret;
  }

  /** Aproximação para expiresIn no JSON (ex.: 15m → 900). Fallback 900. */
  private parseExpiresToSeconds(expiresIn: string): number {
    const m = expiresIn.match(/^(\d+)(s|m|h|d)$/i);
    if (!m) return 900;
    const n = parseInt(m[1], 10);
    const u = m[2].toLowerCase();
    if (u === 's') return n;
    if (u === 'm') return n * 60;
    if (u === 'h') return n * 3600;
    if (u === 'd') return n * 86400;
    return 900;
  }
}
