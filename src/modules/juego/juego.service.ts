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
import { TextosGeneradosService } from './textos-generados/textos-generados.service';

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
    private readonly textosGeneradosService: TextosGeneradosService,
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

    // ---------- 1.5. Validar que el nivel esté desbloqueado ----------
    // Solo aplica al flujo normal ('nivel'). Las recomendaciones docentes
    // y el Boss se saltan esta validación.
    if (origen === OrigenIntento.NIVEL) {
      const desbloqueado = await this.verificarNivelDesbloqueado(
        usuarioId,
        mision.nivel.id,
        mision.nivel.modalidadId,
      );

      if (!desbloqueado) {
        throw new ForbiddenException(
          'Misión bloqueada. Completa los niveles anteriores para acceder.',
        );
      }
    }

    // Verificar si la misión YA estaba completada ANTES de este intento
    const yaCompletadaAntes = await this.intentosService.yaCompletada(
      usuarioId,
      misionId,
      OrigenIntento.NIVEL,
    );



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

    // Cargar tema del estudiante para esta modalidad
    const progreso = await this.progresoService.obtenerOCrear(
      usuarioId,
      mision.nivel.modalidadId,
    );

    let evaluacion;

    if (mision.tipoInteraccion === 'marcar_errores') {
      // Misión de detección de errores → usar el texto generado
      const textoGenerado =
        await this.textosGeneradosService.obtenerParaEvaluacion(
          usuarioId,
          misionId,
        );

      if (!textoGenerado) {
        throw new ForbiddenException(
          'Debes abrir la misión primero para generar el texto antes de responder.',
        );
      }

      evaluacion = await this.iaEvaluator.evaluarDeteccionErrores(
        mision,
        textoGenerado.textoGenerado,
        textoGenerado.respuestasCorrectas,
        dto.respuesta,
      );
    } else {
      // Misión de texto libre → evaluación normal
      evaluacion = await this.iaEvaluator.evaluar(
        mision,
        dto.respuesta,
        progreso.temaInvestigacion,
      );
    }

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
      // Si ANTES de este intento la misión NO estaba completada,
      // entonces este es el primer intento correcto → se otorgan recompensas
      const esPrimeraVez = !yaCompletadaAntes;

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


    // ============================================================
  // MAPA DEL JUEGO
  // ============================================================
  async mapaModalidad(usuarioId: string, modalidadId: number) {
    // 1. Cargar niveles con sus misiones
    const niveles = await this.misionesRepo.manager.query(
      `
      SELECT
        n.id AS nivelId,
        n.numero,
        n.titulo AS nivelTitulo,
        n.descripcion AS nivelDescripcion,
        n.orden,
        n.tipo
      FROM niveles n
      WHERE n.modalidad_id = ?
      ORDER BY n.orden ASC
      `,
      [modalidadId],
    );

    // 2. Cargar todas las misiones de esos niveles
    // 2. Cargar todas las misiones de esos niveles
    const misiones = await this.misionesRepo.manager.query(
      `
      SELECT
        m.id AS misionId,
        m.nivel_id AS nivelId,
        m.titulo,
        m.teoria,
        m.tipo_interaccion AS tipoInteraccion,
        m.contenido_json AS contenidoJson,
        m.competencia,
        m.es_principal AS esPrincipal,
        m.vidas_iniciales AS vidasIniciales,
        m.xp_recompensa AS xpRecompensa,
        m.puntos_investigacion AS puntosInvestigacion
      FROM misiones m
      JOIN niveles n ON n.id = m.nivel_id
      WHERE n.modalidad_id = ?
      ORDER BY n.orden ASC, m.id ASC
      `,
      [modalidadId],
    );

    // 3. Cargar progreso del usuario en esa modalidad
    const progresoArr = await this.misionesRepo.manager.query(
      `
      SELECT
        xp_total AS xpTotal,
        puntos_investigacion_total AS puntosInvestigacionTotal,
        porcentaje,
        nivel_actual_id AS nivelActualId
      FROM progreso_usuario
      WHERE usuario_id = ? AND modalidad_id = ?
      `,
      [usuarioId, modalidadId],
    );

    const progreso = progresoArr[0] ?? {
      xpTotal: 0,
      puntosInvestigacionTotal: 0,
      porcentaje: 0,
      nivelActualId: niveles[0]?.nivelId ?? null,
    };

    // 4. Cargar intentos correctos del usuario en esas misiones
    const intentosCorrectos = await this.misionesRepo.manager.query(
      `
      SELECT DISTINCT i.mision_id AS misionId
      FROM intentos i
      JOIN misiones m ON m.id = i.mision_id
      JOIN niveles n ON n.id = m.nivel_id
      WHERE i.usuario_id = ?
        AND n.modalidad_id = ?
        AND i.resultado = 'correcto'
        AND i.origen = 'nivel'
      `,
      [usuarioId, modalidadId],
    );

    const misionesCompletadas = new Set(
      intentosCorrectos.map((r: any) => String(r.misionId)),
    );

    // 5. Cargar intentos incorrectos recientes (24h) por misión
    const incorrectosRecientes = await this.misionesRepo.manager.query(
      `
      SELECT
        i.mision_id AS misionId,
        COUNT(*) AS total
      FROM intentos i
      JOIN misiones m ON m.id = i.mision_id
      JOIN niveles n ON n.id = m.nivel_id
      WHERE i.usuario_id = ?
        AND n.modalidad_id = ?
        AND i.resultado = 'incorrecto'
        AND i.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY i.mision_id
      `,
      [usuarioId, modalidadId],
    );

    const mapaIncorrectos: Record<string, number> = {};
    for (const r of incorrectosRecientes) {
      mapaIncorrectos[String(r.misionId)] = Number(r.total);
    }

    // 6. Armar respuesta
    const nivelesConMisiones = niveles.map((nivel: any) => {
      const misionesDelNivel = misiones
        .filter((m: any) => String(m.nivelId) === String(nivel.nivelId))
        .map((m: any) => {
          const vidasIniciales = m.vidasIniciales ?? 3;
          const incorrectos = mapaIncorrectos[String(m.misionId)] ?? 0;
          const vidasRestantes = Math.max(0, vidasIniciales - incorrectos);
          const completada = misionesCompletadas.has(String(m.misionId));

          return {
            id: String(m.misionId),
            titulo: m.titulo,
            teoria: m.teoria,
            tipoInteraccion: m.tipoInteraccion,
            contenidoJson: m.contenidoJson,
            competencia: m.competencia,
            
            esPrincipal: Boolean(m.esPrincipal),
            vidasIniciales,
            xpRecompensa: m.xpRecompensa,
            puntosInvestigacion: m.puntosInvestigacion,
            completada,
            vidasRestantes,
            bloqueada: vidasRestantes === 0 && !completada,
          };
        });

      // Nivel completado si TODAS sus misiones principales están completadas
      const principales = misionesDelNivel.filter((m: any) => m.esPrincipal);
      const nivelCompletado =
        principales.length > 0 && principales.every((m: any) => m.completada);

      // Nivel bloqueado si el nivel anterior no está completo
      return {
        id: String(nivel.nivelId),
        numero: nivel.numero,
        titulo: nivel.nivelTitulo,
        descripcion: nivel.nivelDescripcion,
        orden: nivel.orden,
        tipo: nivel.tipo,
        completado: nivelCompletado,
        misiones: misionesDelNivel,
      };
    });

    // Marcar niveles bloqueados: solo el primero está desbloqueado al inicio
    let desbloqueadoHasta = 0;
    for (let i = 0; i < nivelesConMisiones.length; i++) {
      if (nivelesConMisiones[i].completado) {
        desbloqueadoHasta = i + 1;
      } else {
        break;
      }
    }

    for (let i = 0; i < nivelesConMisiones.length; i++) {
      (nivelesConMisiones[i] as any).bloqueado = i > desbloqueadoHasta;
    }

    return {
      progreso: {
        xpTotal: Number(progreso.xpTotal),
        puntosInvestigacionTotal: Number(progreso.puntosInvestigacionTotal),
        porcentaje: Number(progreso.porcentaje),
        nivelActualId: progreso.nivelActualId ? String(progreso.nivelActualId) : null,
      },
      niveles: nivelesConMisiones,
    };
  }

  // ============================================================
  // MI PROGRESO EN UNA MODALIDAD
  // ============================================================
  async miProgreso(usuarioId: string, modalidadId: number) {
    const progreso = await this.progresoService.obtenerOCrear(
      usuarioId,
      modalidadId,
    );

    const totalNiveles = await this.misionesRepo.manager.query(
      `SELECT COUNT(*) AS total FROM niveles WHERE modalidad_id = ?`,
      [modalidadId],
    );

    return {
      xpTotal: progreso.xpTotal,
      puntosInvestigacionTotal: progreso.puntosInvestigacionTotal,
      porcentaje: progreso.porcentaje,
      nivelActualId: progreso.nivelActualId,
      temaInvestigacion: progreso.temaInvestigacion,
      totalNiveles: Number(totalNiveles[0]?.total ?? 0),
    };
  }

  // ============================================================
  // MI HISTORIAL EN UNA MISIÓN
  // ============================================================
  async miHistorial(usuarioId: string, misionId: string) {
    const mision = await this.misionesRepo.findOne({ where: { id: misionId } });
    if (!mision) {
      throw new NotFoundException('Misión no encontrada');
    }

    const historial = await this.misionesRepo.manager.query(
      `
      SELECT
        i.id AS intentoId,
        i.respuesta_texto AS respuesta,
        i.resultado,
        i.puntuacion,
        i.vidas_restantes AS vidasRestantes,
        i.created_at AS createdAt,
        e.respuesta_json AS evaluacion
      FROM intentos i
      LEFT JOIN evaluaciones_ia e ON e.id = i.evaluacion_ia_id
      WHERE i.usuario_id = ? AND i.mision_id = ?
      ORDER BY i.created_at DESC
      LIMIT 20
      `,
      [usuarioId, misionId],
    );

    return {
      mision: {
        id: mision.id,
        titulo: mision.titulo,
        competencia: mision.competencia,
      },
      historial: historial.map((h: any) => ({
        intentoId: String(h.intentoId),
        respuesta: h.respuesta,
        resultado: h.resultado,
        puntuacion: h.puntuacion,
        vidasRestantes: h.vidasRestantes,
        createdAt: h.createdAt,
        evaluacion: h.evaluacion ?? null,
      })),
      totalIntentos: historial.length,
    };
  }

  // ============================================================
  // MIS INSIGNIAS
  // ============================================================
  async misInsignias(usuarioId: string) {
    const insignias = await this.misionesRepo.manager.query(
      `
      SELECT
        i.id,
        i.nombre,
        i.descripcion,
        i.icono_url AS iconoUrl,
        ui.obtenida_en AS obtenidaEn
      FROM usuario_insignias ui
      JOIN insignias i ON i.id = ui.insignia_id
      WHERE ui.usuario_id = ?
      ORDER BY ui.obtenida_en DESC
      `,
      [usuarioId],
    );

    return {
      insignias,
      total: insignias.length,
    };
  }

  // ============================================================
  // ESTADO DE UNA MISIÓN (antes de responder)
  // ============================================================
  async estadoMision(usuarioId: string, misionId: string) {
    const mision = await this.misionesRepo.findOne({
      where: { id: misionId },
      relations: { nivel: true },
    });

    if (!mision) {
      throw new NotFoundException('Misión no encontrada');
    }

    const incorrectos = await this.intentosService.contarIncorrectosRecientes(
      usuarioId,
      misionId,
    );

    const vidasRestantes = Math.max(0, mision.vidasIniciales - incorrectos);

    const yaCompletada = await this.intentosService.yaCompletada(
      usuarioId,
      misionId,
      OrigenIntento.NIVEL,
    );

    return {
      misionId: mision.id,
      titulo: mision.titulo,
      teoria: mision.teoria,
      tipoInteraccion: mision.tipoInteraccion,
      competencia: mision.competencia,
      vidasIniciales: mision.vidasIniciales,
      vidasRestantes,
      completada: yaCompletada,
      puedeResponder: vidasRestantes > 0,
      xpRecompensa: mision.xpRecompensa,
      puntosInvestigacion: mision.puntosInvestigacion,
    };
  }

  // ============================================================
  // ESTABLECER TEMA DEL ESTUDIANTE PARA UNA MODALIDAD
  // ============================================================
  async establecerTema(
    usuarioId: string,
    modalidadId: number,
    tema: string,
  ) {
    // Validar que la modalidad existe
    const modalidadExiste = await this.misionesRepo.manager.query(
      `SELECT id FROM modalidades WHERE id = ?`,
      [modalidadId],
    );

    if (!modalidadExiste || modalidadExiste.length === 0) {
      throw new NotFoundException('Modalidad no encontrada');
    }

    const progreso = await this.progresoService.establecerTema(
      usuarioId,
      modalidadId,
      tema,
    );

    return {
      mensaje: 'Tema de investigación guardado correctamente',
      modalidadId,
      temaInvestigacion: progreso.temaInvestigacion,
    };
  }

   // ============================================================
  // OBTENER TEXTO GENERADO (para misiones marcar_errores)
  // ============================================================
  async obtenerTextoGenerado(usuarioId: string, misionId: string) {
    return this.textosGeneradosService.obtenerOCrear(usuarioId, misionId);
  }

    // ============================================================
  // INSIGNIAS DISPONIBLES (todas + estado de obtención)
  // ============================================================
  async insigniasDisponibles(usuarioId: string) {
    const insignias = await this.misionesRepo.manager.query(
      `
      SELECT
        i.id,
        i.nombre,
        i.descripcion,
        i.icono_url AS iconoUrl,
        CASE WHEN ui.id IS NULL THEN 0 ELSE 1 END AS obtenida,
        ui.obtenida_en AS obtenidaEn
      FROM insignias i
      LEFT JOIN usuario_insignias ui
        ON ui.insignia_id = i.id AND ui.usuario_id = ?
      ORDER BY obtenida DESC, i.id ASC
      `,
      [usuarioId],
    );

    const insigniasFormateadas = insignias.map((i: any) => ({
      id: i.id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      iconoUrl: i.iconoUrl,
      obtenida: Boolean(i.obtenida),
      obtenidaEn: i.obtenidaEn ?? null,
    }));

        const obtenidas = insigniasFormateadas.filter((i: any) => i.obtenida).length;

    return {
      insignias: insigniasFormateadas,
      total: insigniasFormateadas.length,
      obtenidas,
      pendientes: insigniasFormateadas.length - obtenidas,
    };
  }

    // ============================================================
  // MIS MODALIDADES (para el lobby del estudiante)
  // ============================================================
  async misModalidades(usuarioId: string) {
    // 1. Cargar TODAS las modalidades disponibles
    const modalidades = await this.misionesRepo.manager.query(
      `
      SELECT
        id,
        nombre,
        descripcion,
        orden_mundo AS ordenMundo
      FROM modalidades
      ORDER BY orden_mundo ASC
      `,
    );

    // 2. Cargar progreso del usuario en cada modalidad (puede haber 0, 1 o N)
    const progresos = await this.misionesRepo.manager.query(
      `
      SELECT
        modalidad_id AS modalidadId,
        xp_total AS xpTotal,
        puntos_investigacion_total AS puntosInvestigacionTotal,
        porcentaje,
        nivel_actual_id AS nivelActualId,
        tema_investigacion AS temaInvestigacion
      FROM progreso_usuario
      WHERE usuario_id = ?
      `,
      [usuarioId],
    );

    const progresoPorModalidad = new Map<number, any>();
    for (const p of progresos) {
      progresoPorModalidad.set(Number(p.modalidadId), p);
    }

    // 3. Para cada modalidad, contar niveles totales y completados
    const resultado = [];

    for (const m of modalidades) {
      const progreso = progresoPorModalidad.get(Number(m.id));

      // Total de niveles CON misiones principales
      const totalNivelesArr = await this.misionesRepo.manager.query(
        `
        SELECT COUNT(*) AS total
        FROM niveles n
        WHERE n.modalidad_id = ?
        AND EXISTS (
          SELECT 1 FROM misiones mi
          WHERE mi.nivel_id = n.id
          AND mi.es_principal = TRUE
        )
        `,
        [m.id],
      );
      const totalNiveles = Number(totalNivelesArr[0]?.total ?? 0);

      // Niveles completados por el usuario en esta modalidad
      const nivelesCompletadosArr = await this.misionesRepo.manager.query(
        `
        SELECT COUNT(*) AS completados
        FROM niveles n
        WHERE n.modalidad_id = ?
        AND EXISTS (
          SELECT 1 FROM misiones mi
          WHERE mi.nivel_id = n.id
          AND mi.es_principal = TRUE
        )
        AND NOT EXISTS (
          SELECT 1 FROM misiones mi
          WHERE mi.nivel_id = n.id
          AND mi.es_principal = TRUE
          AND NOT EXISTS (
            SELECT 1 FROM intentos i
            WHERE i.mision_id = mi.id
            AND i.usuario_id = ?
            AND i.resultado = 'correcto'
            AND i.origen = 'nivel'
          )
        )
        `,
        [m.id, usuarioId],
      );
      const nivelesCompletados = Number(
        nivelesCompletadosArr[0]?.completados ?? 0,
      );

      // Verificar si el usuario tiene al menos un intento en esta modalidad
      const tieneIntentosArr = await this.misionesRepo.manager.query(
        `
        SELECT COUNT(*) AS total
        FROM intentos i
        JOIN misiones mi ON mi.id = i.mision_id
        JOIN niveles n ON n.id = mi.nivel_id
        WHERE i.usuario_id = ?
        AND n.modalidad_id = ?
        `,
        [usuarioId, m.id],
      );
      const tieneIntentos =
        Number(tieneIntentosArr[0]?.total ?? 0) > 0;

      const tieneTema =
        !!progreso?.temaInvestigacion && progreso.temaInvestigacion.length > 0;

      // Estado de la modalidad
      let estado: 'no_iniciada' | 'sin_tema' | 'en_progreso' | 'completada';
      if (!progreso || (!tieneTema && !tieneIntentos)) {
        estado = 'no_iniciada';
      } else if (!tieneTema) {
        estado = 'sin_tema';
      } else if (totalNiveles > 0 && nivelesCompletados === totalNiveles) {
        estado = 'completada';
      } else {
        estado = 'en_progreso';
      }

      resultado.push({
        modalidadId: Number(m.id),
        nombre: m.nombre,
        descripcion: m.descripcion,
        ordenMundo: Number(m.ordenMundo),
        estado,
        temaInvestigacion: progreso?.temaInvestigacion ?? null,
        xpTotal: Number(progreso?.xpTotal ?? 0),
        puntosInvestigacionTotal: Number(
          progreso?.puntosInvestigacionTotal ?? 0,
        ),
        porcentaje: Number(progreso?.porcentaje ?? 0),
        nivelActualId: progreso?.nivelActualId
          ? String(progreso.nivelActualId)
          : null,
        totalNiveles,
        nivelesCompletados,
      });
    }

    return { modalidades: resultado };
  }

    // ============================================================
  // VALIDACIÓN: NIVEL DESBLOQUEADO
  // ============================================================
  /**
   * Verifica si el nivel indicado está desbloqueado para el usuario.
   *
   * Reglas:
   * - El primer nivel de la modalidad (menor `orden`) siempre está desbloqueado.
   * - Un nivel N está desbloqueado si TODOS los niveles anteriores
   *   (orden < orden de N) tienen sus misiones principales completadas
   *   con resultado='correcto' y origen='nivel'.
   */
  private async verificarNivelDesbloqueado(
    usuarioId: string,
    nivelId: string,
    modalidadId: number,
  ): Promise<boolean> {
    const niveles: Array<{ id: string; orden: number }> =
      await this.misionesRepo.manager.query(
        `
        SELECT id, orden
        FROM niveles
        WHERE modalidad_id = ?
        ORDER BY orden ASC
        `,
        [modalidadId],
      );

    if (niveles.length === 0) {
      return true;
    }

    const idxActual = niveles.findIndex(
      (n) => String(n.id) === String(nivelId),
    );

    if (idxActual === -1) {
      return false;
    }

    if (idxActual === 0) {
      return true;
    }

    const nivelesAnteriores = niveles.slice(0, idxActual);
    const idsAnteriores = nivelesAnteriores.map((n) => String(n.id));

    if (idsAnteriores.length === 0) {
      return true;
    }

    const placeholders = idsAnteriores.map(() => '?').join(',');
    const pendientesArr = await this.misionesRepo.manager.query(
      `
      SELECT COUNT(*) AS pendientes
      FROM misiones m
      WHERE m.nivel_id IN (${placeholders})
        AND m.es_principal = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM intentos i
          WHERE i.mision_id = m.id
            AND i.usuario_id = ?
            AND i.resultado = 'correcto'
            AND i.origen = 'nivel'
        )
      `,
      [...idsAnteriores, usuarioId],
    );

    const pendientes = Number(pendientesArr[0]?.pendientes ?? 0);

    return pendientes === 0;
  }
}