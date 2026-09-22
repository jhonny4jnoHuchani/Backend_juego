import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grupo } from './entities/grupo.entity';
import { GrupoEstudiante } from './entities/grupo-estudiante.entity';
import { CrearGrupoDto } from './dto/crear-grupo.dto';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(Grupo)
    private readonly gruposRepo: Repository<Grupo>,
    @InjectRepository(GrupoEstudiante)
    private readonly grupoEstudiantesRepo: Repository<GrupoEstudiante>,
    private readonly usuariosService: UsuariosService,
  ) {}

  // ============================================================
  // DOCENTE
  // ============================================================

  async crear(docenteId: string, dto: CrearGrupoDto): Promise<Grupo> {
    const codigo = await this.generarCodigoUnico();

    const grupo = this.gruposRepo.create({
      docenteId,
      nombre: dto.nombre,
      codigoAcceso: codigo,
      fechaExpiracion: dto.fechaExpiracion ? new Date(dto.fechaExpiracion) : null,
      activo: true,
    });

    return this.gruposRepo.save(grupo);
  }

  async listarDelDocente(docenteId: string) {
    const grupos = await this.gruposRepo.find({
      where: { docenteId },
      order: { createdAt: 'DESC' },
    });

    // Añadir conteo de estudiantes por grupo
    const gruposConConteo = await Promise.all(
      grupos.map(async (grupo) => {
        const cantidad = await this.grupoEstudiantesRepo.count({
          where: { grupoId: grupo.id },
        });
        return { ...grupo, cantidadEstudiantes: cantidad };
      }),
    );

    return gruposConConteo;
  }

  async detalleDelDocente(docenteId: string, grupoId: string) {
    const grupo = await this.obtenerGrupoDelDocente(docenteId, grupoId);

    const estudiantes = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.universidad,
        u.carrera,
        u.semestre,
        ge.joined_at AS joinedAt
      FROM grupo_estudiantes ge
      JOIN usuarios u ON u.id = ge.usuario_id
      WHERE ge.grupo_id = ?
      ORDER BY ge.joined_at DESC
      `,
      [grupoId],
    );

    return {
      grupo,
      estudiantes,
    };
  }

  async extenderExpiracion(
    docenteId: string,
    grupoId: string,
    nuevaFecha: string | null,
  ): Promise<Grupo> {
    const grupo = await this.obtenerGrupoDelDocente(docenteId, grupoId);
    grupo.fechaExpiracion = nuevaFecha ? new Date(nuevaFecha) : null;
    return this.gruposRepo.save(grupo);
  }

  async desactivar(docenteId: string, grupoId: string): Promise<Grupo> {
    const grupo = await this.obtenerGrupoDelDocente(docenteId, grupoId);
    grupo.activo = !grupo.activo;
    return this.gruposRepo.save(grupo);
  }

  async eliminar(docenteId: string, grupoId: string): Promise<void> {
    const grupo = await this.obtenerGrupoDelDocente(docenteId, grupoId);
    await this.gruposRepo.remove(grupo);
  }

  // ============================================================
  // ESTUDIANTE
  // ============================================================

  async unirseConCodigo(estudianteId: string, codigo: string) {
    const grupo = await this.gruposRepo.findOne({
      where: { codigoAcceso: codigo.toUpperCase() },
    });

    if (!grupo) {
      throw new NotFoundException('Código de grupo inválido');
    }

    if (!grupo.activo) {
      throw new BadRequestException('Este grupo está desactivado');
    }

    if (grupo.fechaExpiracion && new Date(grupo.fechaExpiracion) < new Date()) {
      throw new ForbiddenException('Este grupo ya expiró');
    }

    const yaPertenece = await this.grupoEstudiantesRepo.findOne({
      where: { grupoId: grupo.id, usuarioId: estudianteId },
    });

    if (yaPertenece) {
      throw new ConflictException('Ya perteneces a este grupo');
    }

    await this.grupoEstudiantesRepo.save({
      grupoId: grupo.id,
      usuarioId: estudianteId,
    });

    return {
      mensaje: `Te uniste al grupo "${grupo.nombre}"`,
      grupo: {
        id: grupo.id,
        nombre: grupo.nombre,
        docenteId: grupo.docenteId,
      },
    };
  }

  async listarDelEstudiante(estudianteId: string) {
    return this.grupoEstudiantesRepo.manager.query(
      `
      SELECT
        g.id,
        g.nombre,
        g.codigo_acceso AS codigoAcceso,
        g.fecha_expiracion AS fechaExpiracion,
        g.activo,
        u.nombre AS docenteNombre,
        ge.joined_at AS joinedAt
      FROM grupo_estudiantes ge
      JOIN grupos g ON g.id = ge.grupo_id
      JOIN usuarios u ON u.id = g.docente_id
      WHERE ge.usuario_id = ?
      ORDER BY ge.joined_at DESC
      `,
      [estudianteId],
    );
  }

  async salirDelGrupo(estudianteId: string, grupoId: string) {
    const pertenece = await this.grupoEstudiantesRepo.findOne({
      where: { grupoId, usuarioId: estudianteId },
    });

    if (!pertenece) {
      throw new NotFoundException('No perteneces a este grupo');
    }

    await this.grupoEstudiantesRepo.remove(pertenece);
    return { mensaje: 'Saliste del grupo' };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async obtenerGrupoDelDocente(
    docenteId: string,
    grupoId: string,
  ): Promise<Grupo> {
    const grupo = await this.gruposRepo.findOne({
      where: { id: grupoId, docenteId },
    });

    if (!grupo) {
      throw new NotFoundException('Grupo no encontrado o no te pertenece');
    }

    return grupo;
  }

  /**
   * Verifica si un estudiante pertenece a algún grupo de un docente.
   * Se usará después para los reportes.
   */
  async estudiantePerteneceAlDocente(
    docenteId: string,
    estudianteId: string,
  ): Promise<boolean> {
    const count = await this.grupoEstudiantesRepo.manager.query(
      `
      SELECT COUNT(*) AS total
      FROM grupo_estudiantes ge
      JOIN grupos g ON g.id = ge.grupo_id
      WHERE g.docente_id = ? AND ge.usuario_id = ?
      `,
      [docenteId, estudianteId],
    );

    return Number(count[0]?.total ?? 0) > 0;
  }

  /**
   * Genera un código único de 6 caracteres alfanuméricos en mayúsculas.
   */
  private async generarCodigoUnico(): Promise<string> {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O, 0, I, 1 para evitar confusión
    let codigo = '';
    let intentos = 0;

    while (intentos < 10) {
      codigo = '';
      for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(
          Math.floor(Math.random() * caracteres.length),
        );
      }

      const existe = await this.gruposRepo.findOne({
        where: { codigoAcceso: codigo },
      });

      if (!existe) return codigo;
      intentos++;
    }

    throw new Error('No se pudo generar un código único después de 10 intentos');
  }
}