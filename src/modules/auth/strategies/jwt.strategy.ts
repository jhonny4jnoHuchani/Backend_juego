import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../../usuarios/usuarios.service';

interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') ?? 'cambiar_en_produccion',
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usuariosService.buscarPorId(payload.sub);
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
  }
}