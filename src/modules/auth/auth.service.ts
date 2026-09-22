import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  // ============================================================
  // REGISTRO
  // ============================================================
  async register(dto: RegisterDto) {
    const existente = await this.usuariosService.buscarPorEmail(dto.email);
    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = await this.usuariosService.crear({
      nombre: dto.nombre,
      email: dto.email,
      passwordHash,
      rol: dto.rol,
      universidad: dto.universidad,
      carrera: dto.carrera,
      semestre: dto.semestre,
    });

    return this.generarTokens(usuario.id, usuario.email, usuario.rol);
  }

  // ============================================================
  // LOGIN
  // ============================================================
  async login(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarPorEmail(dto.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generarTokens(usuario.id, usuario.email, usuario.rol);
  }

  // ============================================================
  // REFRESH
  // ============================================================
  async refresh(refreshTokenPlano: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshTokenPlano, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const tokenHash = this.hashToken(refreshTokenPlano);

    const registro = await this.refreshRepo.findOne({
      where: { tokenHash, revocado: false },
    });

    if (!registro) {
      throw new UnauthorizedException('Refresh token no encontrado o revocado');
    }

    if (new Date(registro.expiraEn) < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const usuario = await this.usuariosService.buscarPorIdOrFail(payload.sub);

    return this.generarTokens(usuario.id, usuario.email, usuario.rol);
  }

  // ============================================================
  // LOGOUT (revoca solo el refresh token actual)
  // ============================================================
  async logout(refreshTokenPlano: string) {
    const tokenHash = this.hashToken(refreshTokenPlano);
    await this.refreshRepo.update({ tokenHash }, { revocado: true });
    return { mensaje: 'Sesión cerrada correctamente' };
  }

  // ============================================================
  // HELPERS
  // ============================================================
    private async generarTokens(usuarioId: string, email: string, rol: string) {
    const payload = { sub: usuarioId, email, rol };

    const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn') as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn') as any,
    });

    await this.guardarRefreshToken(usuarioId, refreshToken);

    return {
        accessToken,
        refreshToken,
        usuario: { id: usuarioId, email, rol },
    };
    }

  private async guardarRefreshToken(usuarioId: string, refreshTokenPlano: string) {
    const tokenHash = this.hashToken(refreshTokenPlano);

    const expiraEn = new Date();
    expiraEn.setDate(expiraEn.getDate() + 7); // 7 días

    const registro = this.refreshRepo.create({
      usuarioId,
      tokenHash,
      expiraEn,
      revocado: false,
    });

    await this.refreshRepo.save(registro);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}