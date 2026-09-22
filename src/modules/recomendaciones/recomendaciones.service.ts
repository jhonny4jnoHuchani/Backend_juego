import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecomendacionDocente } from './entities/recomendacion-docente.entity';
import { Mision } from '../misiones/entities/mision.entity';
import { CrearRecomendacionDto } from './dto/crear-recomendacion.dto';
import { GruposService } from '../grupos/grupos.service';

@Injectable()
export class RecomendacionesService {
  constructor(
    @InjectRepository(RecomendacionDocente)
    private readonly recomendacionesRepo: Repository<RecomendacionDocente>,
    @InjectRepository(Mision)
    private readonly misionesRepo: Repository<Mision>,
    private readonly gruposService: GruposService,
  ) {}

  // ============================================================
  // DOCENTE
  // ============================================================

  async crear(docenteId: string, dto: CrearRecomendacionDto) {
    // 1. Validar que el estudiante pertenece a un grupo del docente
    const pertenece = await this.gruposService.estudiantePerteneceAlDocente(
      docenteId,
      dto.estudianteId,
    );

    if (!pertenece) {
      throw new ForbiddenException(
        'El estudiante no pertenece a ninguno de tus grupos',
      );
    }

    // 2. Validar que la misión existe
    const mision = await this.misionesRepo.findOne({
      where: { id: dto.misionId },
    });

    if (!mision) {
      throw new NotFoundException('Misión no encontrada');
    }

    // 3. Crear la recomendación
    const recomendacion = this.recomendacionesRepo.create({
      docenteId,
      estudianteId: dto.estudianteId,
      misionId: dto.misionId,
      nota: dto.nota ?? null,
      completada: false,
    });

    return this.recomendacionesRepo.save(recomendacion);
  }

  async listarDelDocente(docenteId: string) {
    return this.recomendacionesRepo.find({
      where: { docenteId },
      order: { createdAt: 'DESC' },
    });
  }

  async eliminar(docenteId: string, recomendacionId: string) {
    const recomendacion = await this.recomendacionesRepo.findOne({
      where: { id: recomendacionId, docenteId },
    });

    if (!recomendacion) {
      throw new NotFoundException('Recomendación no encontrada');
    }

    await this.recomendacionesRepo.remove(recomendacion);
    return { mensaje: 'Recomendación eliminada' };
  }

  // ============================================================
  // ESTUDIANTE
  // ============================================================

  async listarDelEstudiante(estudianteId: string) {
    return this.recomendacionesRepo.manager.query(
      `
      SELECT
        r.id,
        r.nota,
        r.completada,
        r.created_at AS createdAt,
        m.id AS misionId,
        m.titulo AS misionTitulo,
        m.enunciado AS misionEnunciado,
        m.tipo_interaccion AS tipoInteraccion,
        m.competencia,
        m.xp_recompensa AS xpRecompensa,
        m.puntos_investigacion AS puntosInvestigacion,
        u.nombre AS docenteNombre
      FROM recomendaciones_docente r
      JOIN misiones m ON m.id = r.mision_id
      JOIN usuarios u ON u.id = r.docente_id
      WHERE r.estudiante_id = ?
      ORDER BY r.completada ASC, r.created_at DESC
      `,
      [estudianteId],
    );
  }

  /**
   * Verifica si el estudiante tiene una recomendación activa (no completada)
   * para esa misión. Se usará desde el JuegoService para marcar como completada.
   */
  async buscarRecomendacionActiva(
    estudianteId: string,
    misionId: string,
  ): Promise<RecomendacionDocente | null> {
    return this.recomendacionesRepo.findOne({
      where: {
        estudianteId,
        misionId,
        completada: false,
      },
    });
  }

  /**
   * Marca como completada una recomendación.
   * Se llama desde el JuegoService cuando el estudiante responde correctamente
   * la misión que le fue asignada como refuerzo.
   */
  async marcarCompletada(recomendacionId: string): Promise<void> {
    await this.recomendacionesRepo.update(
      { id: recomendacionId },
      { completada: true },
    );
  }
}