import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grupo } from '../grupos/entities/grupo.entity';
import { GrupoEstudiante } from '../grupos/entities/grupo-estudiante.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Grupo)
    private readonly gruposRepo: Repository<Grupo>,
    @InjectRepository(GrupoEstudiante)
    private readonly grupoEstudiantesRepo: Repository<GrupoEstudiante>,
  ) {}

  // ============================================================
  // PROGRESO DEL GRUPO
  // ============================================================
  async progresoDelGrupo(docenteId: string, grupoId: string) {
    // Validar que el grupo pertenece al docente
    const grupo = await this.gruposRepo.findOne({
      where: { id: grupoId, docenteId },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado o no te pertenece');
    }

    // Query: estudiantes + progreso por modalidad
    const estudiantes = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.universidad,
        u.carrera,
        u.semestre,
        ge.joined_at AS joinedAt,
        COALESCE(SUM(pu.xp_total), 0) AS xpTotal,
        COALESCE(SUM(pu.puntos_investigacion_total), 0) AS puntosInvestigacionTotal,
        COALESCE(MAX(pu.porcentaje), 0) AS porcentajeMax,
        COUNT(DISTINCT CASE WHEN pu.nivel_actual_id IS NOT NULL THEN pu.modalidad_id END) AS modalidadesActivas
      FROM grupo_estudiantes ge
      JOIN usuarios u ON u.id = ge.usuario_id
      LEFT JOIN progreso_usuario pu ON pu.usuario_id = u.id
      WHERE ge.grupo_id = ?
      GROUP BY u.id, u.nombre, u.email, u.universidad, u.carrera, u.semestre, ge.joined_at
      ORDER BY porcentajeMax DESC, xpTotal DESC
      `,
      [grupoId],
    );

    return {
      grupo: {
        id: grupo.id,
        nombre: grupo.nombre,
        codigoAcceso: grupo.codigoAcceso,
        fechaExpiracion: grupo.fechaExpiracion,
        activo: grupo.activo,
      },
      estudiantes,
      totalEstudiantes: estudiantes.length,
    };
  }

  // ============================================================
  // COMPETENCIAS DÉBILES DE UN ESTUDIANTE
  // ============================================================
  async competenciasDebiles(docenteId: string, estudianteId: string) {
    // Validar que el estudiante pertenece a algún grupo del docente
    const pertenece = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT COUNT(*) AS total
      FROM grupo_estudiantes ge
      JOIN grupos g ON g.id = ge.grupo_id
      WHERE g.docente_id = ? AND ge.usuario_id = ?
      `,
      [docenteId, estudianteId],
    );

    if (Number(pertenece[0]?.total ?? 0) === 0) {
      throw new ForbiddenException(
        'El estudiante no pertenece a ninguno de tus grupos',
      );
    }

    // Query: competencias donde falla más (incorrecto o parcial)
    const competencias = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        m.competencia,
        COUNT(*) AS fallos,
        SUM(CASE WHEN i.resultado = 'incorrecto' THEN 1 ELSE 0 END) AS incorrectos,
        SUM(CASE WHEN i.resultado = 'parcial' THEN 1 ELSE 0 END) AS parciales
      FROM intentos i
      JOIN misiones m ON m.id = i.mision_id
      WHERE i.usuario_id = ?
        AND i.resultado IN ('incorrecto', 'parcial')
        AND i.origen = 'nivel'
        AND m.competencia IS NOT NULL
      GROUP BY m.competencia
      ORDER BY fallos DESC
      `,
      [estudianteId],
    );

    // Info básica del estudiante
    const estudiante = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT id, nombre, email, universidad, carrera, semestre
      FROM usuarios
      WHERE id = ?
      `,
      [estudianteId],
    );

    if (!estudiante || estudiante.length === 0) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    return {
      estudiante: estudiante[0],
      competenciasDebiles: competencias,
      totalCompetencias: competencias.length,
    };
  }
}