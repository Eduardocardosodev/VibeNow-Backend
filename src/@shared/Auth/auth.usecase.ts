import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { User } from 'src/user/domain/entities/user.entity';
import { UserUsecase } from 'src/user/usecases/User.usecase';
import { LoginDto } from './dto/auth.dto';

/** Access token curto; refresh JWT longo — ambos stateless (nada no banco). */
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES ?? '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES ?? '7d';

@Injectable()
export class AuthUsecase {
  constructor(
    private readonly userUsecase: UserUsecase,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.userUsecase.findByPhone(data.phone);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshSecret = this.getRefreshSecret();
    let payload: { sub?: string | number; typ?: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string | number;
        typ: string;
      }>(refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId =
      typeof payload.sub === 'number' ? payload.sub : Number(payload.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userUsecase.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
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
        'JWT_REFRESH_SECRET is not configured',
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
