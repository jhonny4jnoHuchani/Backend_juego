import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mision } from '../misiones/entities/mision.entity';
import { IAEvaluatorService } from '../ia/ia-evaluator.service';
import { IntentosService } from './intentos/intentos.service';
import { EvaluacionesIaService } from './evaluaciones-ia/evaluaciones-ia.service';
import { ProgresoService } from './progreso/progreso.service';
import { InsigniasService } from './insignias/insignias.service';
import { ResponderMisionDto } from './dto/responder-mision.dto';
import { OrigenIntento } from '../../common/enums/origen-intento.enum';
import { ResultadoIntento } from '../../common/enums/resultado-intento.enum';

import { RecomendacionesService } from '../recomendaciones/recomendaciones.service';

@Injectable()
export class JuegoService {
  private readonly logger = new Logger(JuegoService.name);

  constructor(
    @InjectRepository(Mision)
    private readonly misionesRepo: Repository<Mision>,
    private readonly iaEvaluator: IAEvaluatorService,
    private readonly intentosService: IntentosService,
    private readonly evaluacionesIaService: EvaluacionesIaService,
    private readonly progresoService: ProgresoService,
    private readonly insigniasService: InsigniasService,
    private readonly recomendacionesService: RecomendacionesService,
  ) {}

  async responderMision(
    usuarioId: string,
    misionId: string,
    dto: ResponderMisionDto,
  ) {
    // ---------- 1. Cargar la misión ----------
    const mision = await this.misionesRepo.findOne({
      where: { id: misionId },
      relations: { nivel: true },
    });

    if (!mision) {
      throw new NotFoundException('Misión no encontrada');
    }

    const origen = dto.origen ?? OrigenIntento.NIVEL;

    // ---------- 2. Calcular vidas restantes ----------
    const incorrectosRecientes = await this.intentosService.contarIncorrectosRecientes(
      usuarioId,
      misionId,
    );

    const vidasRestantesAntes = mision.vidasIniciales - incorrectosRecientes;

    // ---------- 3. Validar vidas ----------
    if (vidasRestantesAntes <= 0) {
      throw new ForbiddenException(
        'Sin vidas disponibles para esta misión. Espera 24 horas para reintentar.',
      );
    }

    // ---------- 4. Llamar a la IA ----------
    this.logger.log(
      `Evaluando respuesta de usuario ${usuarioId} en misión ${misionId}...`,
    );

    const evaluacion = await this.iaEvaluator.evaluar(mision, dto.respuesta);

    // ---------- 5. Calcular vidas restantes DESPUÉS del intento ----------
    let vidasRestantesDespues = vidasRestantesAntes;
    if (evaluacion.resultado === ResultadoIntento.INCORRECTO) {
      vidasRestantesDespues = vidasRestantesAntes - 1;
    }
    // Correcto y parcial NO restan vida

    // ---------- 6. Guardar intento ----------
    const intento = await this.intentosService.guardar({
      usuarioId,
      misionId,
      origen,
      respuestaTexto: dto.respuesta,
      vidasRestantes: vidasRestantesDespues,
      resultado: evaluacion.resultado,
      puntuacion: evaluacion.puntuacion,
    });

    // ---------- 7. Guardar evaluación IA ----------
    const evaluacionGuardada = await this.evaluacionesIaService.guardar({
      intentoId: intento.id,
      evaluacion,
    });

    // ---------- 8. Asignar evaluación al intento ----------
    await this.intentosService.asignarEvaluacion(
      intento.id,
      evaluacionGuardada.id,
    );

    // ---------- 9. Actualizar progreso (solo si origen=nivel y correcto) ----------
    let progresoActualizado: any = null;
    let insigniasNuevas: any[] = [];

    if (origen === OrigenIntento.NIVEL && evaluacion.resultado === ResultadoIntento.CORRECTO) {
      const yaCompletada = await this.intentosService.yaCompletada(
        usuarioId,
        misionId,
        OrigenIntento.NIVEL,
      );

      // Si es la PRIMERA vez que completa esta misión, se otorgan recompensas
      // (yaCompletada se evalúa ANTES de guardar el intento actual, por eso si es false,
      // significa que este intento es el primero correcto)
      const esPrimeraVez = !yaCompletada;

      // Sumar XP y PI (siempre al completar, incluso repitiendo, para no frustrar)
      // Pero para evitar farming, solo la primera vez cuenta
      if (esPrimeraVez) {
        await this.progresoService.sumarRecompensas(
          usuarioId,
          mision.nivel.modalidadId,
          mision.xpRecompensa,
          mision.puntosInvestigacion,
        );
      }

      await this.progresoService.recalcularPorcentaje(
        usuarioId,
        mision.nivel.modalidadId,
      );

      await this.progresoService.actualizarNivelActual(
        usuarioId,
        mision.nivel.modalidadId,
      );

      progresoActualizado = await this.progresoService.obtenerOCrear(
        usuarioId,
        mision.nivel.modalidadId,
      );

      // ---------- 10. Evaluar insignias ----------
      insigniasNuevas = await this.insigniasService.evaluarYOtorgar(usuarioId, {
        intentoActualId: intento.id,
        resultadoActual: evaluacion.resultado,
        nivelId: mision.nivel.id,
        modalidadId: mision.nivel.modalidadId,
      });
    }

        // ---------- 9.5. Marcar recomendación como completada (si aplica) ----------
    if (
      origen === OrigenIntento.RECOMENDACION_DOCENTE &&
      evaluacion.resultado === ResultadoIntento.CORRECTO
    ) {
      const recomendacionActiva =
        await this.recomendacionesService.buscarRecomendacionActiva(
          usuarioId,
          misionId,
        );

      if (recomendacionActiva) {
        await this.recomendacionesService.marcarCompletada(
          recomendacionActiva.id,
        );
        this.logger.log(
          `✅ Recomendación ${recomendacionActiva.id} marcada como completada`,
        );
      }
    }

    // ---------- 11. Devolver respuesta ----------
    return {
      intento: {
        id: intento.id,
        resultado: evaluacion.resultado,
        puntuacion: evaluacion.puntuacion,
        vidasRestantes: vidasRestantesDespues,
        createdAt: intento.createdAt,
      },
      evaluacion: {
        criterios: evaluacion.criterios,
        pista: evaluacion.pista,
        explicacion: evaluacion.explicacion,
      },
      progreso: progresoActualizado
        ? {
            xpTotal: progresoActualizado.xpTotal,
            puntosInvestigacionTotal: progresoActualizado.puntosInvestigacionTotal,
            porcentaje: progresoActualizado.porcentaje,
            nivelActualId: progresoActualizado.nivelActualId,
          }
        : null,
      insigniasNuevas: insigniasNuevas.map((i) => ({
        id: i.id,
        nombre: i.nombre,
        descripcion: i.descripcion,
      })),
      vidasRestantesHoy: vidasRestantesDespues,
    };
  }
}