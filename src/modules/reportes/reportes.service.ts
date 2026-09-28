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

    // ============================================================
  // RANKING DE ESTUDIANTES POR XP
  // ============================================================
  async rankingDelGrupo(docenteId: string, grupoId: string) {
    // Validar que el grupo pertenece al docente
    const grupo = await this.gruposRepo.findOne({
      where: { id: grupoId, docenteId },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado o no te pertenece');
    }

    const ranking = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.email,
        COALESCE(SUM(pu.xp_total), 0) AS xpTotal,
        COALESCE(SUM(pu.puntos_investigacion_total), 0) AS puntosInvestigacionTotal,
        COALESCE(MAX(pu.porcentaje), 0) AS porcentajeMax
      FROM grupo_estudiantes ge
      JOIN usuarios u ON u.id = ge.usuario_id
      LEFT JOIN progreso_usuario pu ON pu.usuario_id = u.id
      WHERE ge.grupo_id = ?
      GROUP BY u.id, u.nombre, u.email
      ORDER BY xpTotal DESC, u.nombre ASC
      `,
      [grupoId],
    );

    return {
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      ranking,
      total: ranking.length,
    };
  }

  // ============================================================
  // MISIONES DONDE MÁS FALLAN LOS ESTUDIANTES DEL GRUPO
  // ============================================================
  async misionesFalladasDelGrupo(docenteId: string, grupoId: string) {
    // Validar grupo
    const grupo = await this.gruposRepo.findOne({
      where: { id: grupoId, docenteId },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado o no te pertenece');
    }

    const misiones = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        m.id AS misionId,
        m.titulo,
        m.competencia,
        COUNT(*) AS totalIntentos,
        SUM(CASE WHEN i.resultado = 'incorrecto' THEN 1 ELSE 0 END) AS incorrectos,
        SUM(CASE WHEN i.resultado = 'parcial' THEN 1 ELSE 0 END) AS parciales,
        SUM(CASE WHEN i.resultado = 'correcto' THEN 1 ELSE 0 END) AS correctos
      FROM grupo_estudiantes ge
      JOIN intentos i ON i.usuario_id = ge.usuario_id
      JOIN misiones m ON m.id = i.mision_id
      WHERE ge.grupo_id = ?
        AND i.origen = 'nivel'
      GROUP BY m.id, m.titulo, m.competencia
      HAVING incorrectos > 0 OR parciales > 0
      ORDER BY incorrectos DESC, parciales DESC
      LIMIT 20
      `,
      [grupoId],
    );

    return {
      grupoId: grupo.id,
      grupoNombre: grupo.nombre,
      misiones,
      total: misiones.length,
    };
  }

  // ============================================================
  // RESUMEN COMPLETO DEL GRUPO
  // ============================================================
  async resumenDelGrupo(docenteId: string, grupoId: string) {
    // Validar grupo
    const grupo = await this.gruposRepo.findOne({
      where: { id: grupoId, docenteId },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado o no te pertenece');
    }

    // 1. Totales básicos
    const totales = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        COUNT(DISTINCT ge.usuario_id) AS totalEstudiantes,
        COALESCE(AVG(pu.xp_total), 0) AS xpPromedio,
        COALESCE(AVG(pu.porcentaje), 0) AS porcentajePromedio
      FROM grupo_estudiantes ge
      LEFT JOIN progreso_usuario pu ON pu.usuario_id = ge.usuario_id
      WHERE ge.grupo_id = ?
      `,
      [grupoId],
    );

    // 2. Estudiantes activos (que jugaron últimos 7 días)
    const activos = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT COUNT(DISTINCT i.usuario_id) AS activos
      FROM grupo_estudiantes ge
      JOIN intentos i ON i.usuario_id = ge.usuario_id
      WHERE ge.grupo_id = ?
        AND i.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      `,
      [grupoId],
    );

    // 3. Top 3 competencias débiles del grupo
    const competenciasDebiles = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        m.competencia,
        COUNT(*) AS fallos
      FROM grupo_estudiantes ge
      JOIN intentos i ON i.usuario_id = ge.usuario_id
      JOIN misiones m ON m.id = i.mision_id
      WHERE ge.grupo_id = ?
        AND i.resultado IN ('incorrecto', 'parcial')
        AND i.origen = 'nivel'
        AND m.competencia IS NOT NULL
      GROUP BY m.competencia
      ORDER BY fallos DESC
      LIMIT 3
      `,
      [grupoId],
    );

    const totalesData = totales[0] ?? {
      totalEstudiantes: 0,
      xpPromedio: 0,
      porcentajePromedio: 0,
    };

    return {
      grupo: {
        id: grupo.id,
        nombre: grupo.nombre,
        codigoAcceso: grupo.codigoAcceso,
        activo: grupo.activo,
      },
      totalEstudiantes: Number(totalesData.totalEstudiantes),
      xpPromedio: Math.round(Number(totalesData.xpPromedio)),
      porcentajePromedio: Math.round(Number(totalesData.porcentajePromedio)),
      estudiantesActivosUltimos7Dias: Number(activos[0]?.activos ?? 0),
      competenciasDebiles,
    };
  }


    // ============================================================
  // MISIONES CANDIDATAS PARA RECOMENDAR A UN ESTUDIANTE
  // ============================================================
  async misionesCandidatas(docenteId: string, estudianteId: string) {
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

    const misiones = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        m.id,
        m.titulo,
        m.competencia,
        n.titulo AS nivelTitulo,
        mo.nombre AS modalidadNombre,
        COUNT(*) AS fallos
      FROM intentos i
      JOIN misiones m ON m.id = i.mision_id
      JOIN niveles n ON n.id = m.nivel_id
      JOIN modalidades mo ON mo.id = n.modalidad_id
      WHERE i.usuario_id = ?
        AND i.resultado IN ('incorrecto', 'parcial')
        AND i.origen = 'nivel'
        AND NOT EXISTS (
          SELECT 1 FROM intentos i2
          WHERE i2.usuario_id = i.usuario_id
            AND i2.mision_id = i.mision_id
            AND i2.resultado = 'correcto'
            AND i2.origen = 'nivel'
        )
      GROUP BY m.id, m.titulo, m.competencia, n.titulo, mo.nombre
      ORDER BY fallos DESC, m.id ASC
      LIMIT 20
      `,
      [estudianteId],
    );

    return {
      estudianteId,
      misiones: misiones.map((m: any) => ({
        id: String(m.id),
        titulo: m.titulo,
        competencia: m.competencia,
        nivelTitulo: m.nivelTitulo,
        modalidadNombre: m.modalidadNombre,
        fallos: Number(m.fallos),
      })),
      total: misiones.length,
    };
  }
}