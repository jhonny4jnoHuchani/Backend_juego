import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionBoss } from './entities/sesion-boss.entity';
import { Nivel } from '../niveles/entities/nivel.entity';
import { Mision } from '../misiones/entities/mision.entity';
import { ResponderBossDto } from './dto/responder-boss.dto';
import { JuegoService } from '../juego/juego.service';
import { OrigenIntento } from '../../common/enums/origen-intento.enum';

@Injectable()
export class BossService {
  private readonly logger = new Logger(BossService.name);
  private readonly DURACION_DEFAULT = 900; // 15 minutos

  constructor(
    @InjectRepository(SesionBoss)
    private readonly sesionesRepo: Repository<SesionBoss>,
    @InjectRepository(Nivel)
    private readonly nivelesRepo: Repository<Nivel>,
    @InjectRepository(Mision)
    private readonly misionesRepo: Repository<Mision>,
    private readonly juegoService: JuegoService,
  ) {}

  /**
   * Inicia una nueva sesión de Boss.
   */
  async iniciar(usuarioId: string, nivelId: string) {
    // Validar que el nivel existe y es tipo boss
    const nivel = await this.nivelesRepo.findOne({
      where: { id: nivelId },
    });

    if (!nivel) {
      throw new NotFoundException('Nivel no encontrado');
    }

    if (nivel.tipo !== 'boss') {
      throw new BadRequestException('Este nivel no es tipo Boss');
    }

    // Finalizar sesiones anteriores no finalizadas de este usuario + nivel
    await this.finalizarSesionesHuerfanas(usuarioId, nivelId);

    // Crear nueva sesión
    const ahora = new Date();
    const sesion = this.sesionesRepo.create({
      usuarioId,
      nivelId,
      iniciadoEn: ahora,
      duracionSegundos: this.DURACION_DEFAULT,
      finalizado: false,
      resultadoFinal: null,
    });

    const guardada = await this.sesionesRepo.save(sesion);

    this.logger.log(
      `🎮 Sesión Boss ${guardada.id} iniciada para usuario ${usuarioId} en nivel ${nivelId}`,
    );

    return this.formatearSesion(guardada);
  }

  /**
   * Consulta el estado actual de una sesión.
   * Aplica lazy-check: si expiró, la marca como no_superado.
   */
  async consultar(usuarioId: string, sesionId: string) {
    const sesion = await this.sesionesRepo.findOne({
      where: { id: sesionId, usuarioId },
    });

    if (!sesion) {
      throw new NotFoundException('Sesión Boss no encontrada');
    }

    await this.aplicarLazyCheck(sesion);

    return this.formatearSesion(sesion);
  }

  /**
   * Responde una misión dentro de la sesión Boss.
   */
  async responder(usuarioId: string, sesionId: string, dto: ResponderBossDto) {
    const sesion = await this.sesionesRepo.findOne({
      where: { id: sesionId, usuarioId },
    });

    if (!sesion) {
      throw new NotFoundException('Sesión Boss no encontrada');
    }

    // Lazy-check: si expiró o ya finalizó, no se permite responder
    await this.aplicarLazyCheck(sesion);

    if (sesion.finalizado) {
      throw new ForbiddenException(
        'Esta sesión de Boss ya finalizó. Inicia una nueva para reintentar.',
      );
    }

    // Validar que la misión pertenece al nivel del Boss
    const mision = await this.misionesRepo.findOne({
      where: { id: dto.misionId, nivelId: sesion.nivelId },
    });

    if (!mision) {
      throw new BadRequestException('La misión no pertenece a este Boss');
    }

    // Delegar al JuegoService (reutiliza todo el motor)
    const resultado = await this.juegoService.responderMision(usuarioId, dto.misionId, {
      respuesta: dto.respuesta,
      origen: OrigenIntento.NIVEL,
    });

    // Después de responder, verificar si el Boss está completo o expirado
    const estadoFinal = await this.verificarEstadoFinal(sesion);

    return {
      ...resultado,
      boss: {
        sesionId: sesion.id,
        finalizado: estadoFinal.finalizado,
        resultadoFinal: estadoFinal.resultadoFinal,
        tiempoRestanteSegundos: estadoFinal.tiempoRestanteSegundos,
      },
    };
  }

  // ============================================================
  // LÓGICA INTERNA
  // ============================================================

  /**
   * Finaliza sesiones anteriores del mismo usuario + nivel que quedaron abiertas.
   */
  private async finalizarSesionesHuerfanas(usuarioId: string, nivelId: string) {
    const abiertas = await this.sesionesRepo.find({
      where: { usuarioId, nivelId, finalizado: false },
    });

    for (const sesion of abiertas) {
      await this.aplicarLazyCheck(sesion);
    }
  }

  /**
   * Aplica lazy-check: si el tiempo expiró, marca la sesión como no_superado.
   */
  private async aplicarLazyCheck(sesion: SesionBoss) {
    if (sesion.finalizado) return;

    const ahora = new Date();
    const transcurrido = (ahora.getTime() - sesion.iniciadoEn.getTime()) / 1000;

    if (transcurrido > sesion.duracionSegundos) {
      sesion.finalizado = true;
      sesion.resultadoFinal = 'no_superado';
      await this.sesionesRepo.save(sesion);

      this.logger.warn(
        `⏱️ Sesión Boss ${sesion.id} expiró (${Math.round(transcurrido)}s > ${sesion.duracionSegundos}s) → no_superado`,
      );
    }
  }

  /**
   * Verifica si el Boss está completo (todas las misiones principales correctas)
   * o si expiró el tiempo.
   */
  private async verificarEstadoFinal(sesion: SesionBoss) {
    // Calcular tiempo restante
    const ahora = new Date();
    const transcurrido = (ahora.getTime() - sesion.iniciadoEn.getTime()) / 1000;
    const tiempoRestante = Math.max(0, sesion.duracionSegundos - transcurrido);

    // Si ya está finalizado, devolver como está
    if (sesion.finalizado) {
      return {
        finalizado: true,
        resultadoFinal: sesion.resultadoFinal,
        tiempoRestanteSegundos: 0,
      };
    }

    // Si se acabó el tiempo, marcar no_superado
    if (tiempoRestante <= 0) {
      sesion.finalizado = true;
      sesion.resultadoFinal = 'no_superado';
      await this.sesionesRepo.save(sesion);
      return {
        finalizado: true,
        resultadoFinal: 'no_superado',
        tiempoRestanteSegundos: 0,
      };
    }

    // Verificar si el Boss está completo (todas las misiones principales correctas)
    const pendientes = await this.sesionesRepo.manager.query(
      `
      SELECT COUNT(*) AS pendientes
      FROM misiones m
      WHERE m.nivel_id = ?
      AND m.es_principal = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM intentos i
        WHERE i.mision_id = m.id
        AND i.usuario_id = ?
        AND i.resultado = 'correcto'
        AND i.origen = 'nivel'
      )
      `,
      [sesion.nivelId, sesion.usuarioId],
    );

    const cantidadPendientes = Number(pendientes[0]?.pendientes ?? 0);

    if (cantidadPendientes === 0) {
      // Boss completado con éxito
      sesion.finalizado = true;
      sesion.resultadoFinal = 'superado';
      await this.sesionesRepo.save(sesion);

      this.logger.log(`🏆 Sesión Boss ${sesion.id} superada`);

      return {
        finalizado: true,
        resultadoFinal: 'superado',
        tiempoRestanteSegundos: 0,
      };
    }

    return {
      finalizado: false,
      resultadoFinal: null,
      tiempoRestanteSegundos: Math.floor(tiempoRestante),
    };
  }

  /**
   * Formatea una sesión para devolver al frontend.
   */
  private formatearSesion(sesion: SesionBoss) {
    const ahora = new Date();
    const transcurrido = (ahora.getTime() - sesion.iniciadoEn.getTime()) / 1000;
    const tiempoRestante = Math.max(0, sesion.duracionSegundos - transcurrido);

    return {
      id: sesion.id,
      nivelId: sesion.nivelId,
      iniciadoEn: sesion.iniciadoEn,
      duracionSegundos: sesion.duracionSegundos,
      finalizado: sesion.finalizado,
      resultadoFinal: sesion.resultadoFinal,
      tiempoRestanteSegundos: Math.floor(tiempoRestante),
    };
  }
}