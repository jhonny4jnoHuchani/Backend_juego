import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgresoUsuario } from './entities/progreso-usuario.entity';
import { Nivel } from '../../niveles/entities/nivel.entity';

@Injectable()
export class ProgresoService {
  constructor(
    @InjectRepository(ProgresoUsuario)
    private readonly progresoRepo: Repository<ProgresoUsuario>,
    @InjectRepository(Nivel)
    private readonly nivelesRepo: Repository<Nivel>,
  ) {}

  /**
   * Obtiene o crea el registro de progreso de un usuario en una modalidad.
   */
  async obtenerOCrear(
    usuarioId: string,
    modalidadId: number,
  ): Promise<ProgresoUsuario> {
    let progreso = await this.progresoRepo.findOne({
      where: { usuarioId, modalidadId },
    });

    if (!progreso) {
      // Buscar el primer nivel de la modalidad
      const primerNivel = await this.nivelesRepo.findOne({
        where: { modalidadId },
        order: { orden: 'ASC' },
      });

      progreso = this.progresoRepo.create({
        usuarioId,
        modalidadId,
        nivelActualId: primerNivel?.id ?? null,
        xpTotal: 0,
        puntosInvestigacionTotal: 0,
        porcentaje: 0,
      });

      progreso = await this.progresoRepo.save(progreso);
    }

    return progreso;
  }

  /**
   * Suma XP y puntos de investigación.
   */
  async sumarRecompensas(
    usuarioId: string,
    modalidadId: number,
    xp: number,
    puntosInvestigacion: number,
  ): Promise<ProgresoUsuario> {
    const progreso = await this.obtenerOCrear(usuarioId, modalidadId);

    progreso.xpTotal += xp;
    progreso.puntosInvestigacionTotal += puntosInvestigacion;

    return this.progresoRepo.save(progreso);
  }

  /**
   * Recalcula el porcentaje de la modalidad basado en niveles completados.
   * Un nivel está completo cuando TODAS sus misiones principales
   * tienen al menos un intento correcto con origen='nivel'.
   */
  async recalcularPorcentaje(
    usuarioId: string,
    modalidadId: number,
  ): Promise<ProgresoUsuario> {
    const progreso = await this.obtenerOCrear(usuarioId, modalidadId);

    // Total de niveles de la modalidad
    const totalNiveles = await this.nivelesRepo.count({
      where: { modalidadId },
    });

    if (totalNiveles === 0) {
      progreso.porcentaje = 0;
      return this.progresoRepo.save(progreso);
    }

    // Niveles completados por el usuario
    const nivelesCompletados = await this.contarNivelesCompletados(
      usuarioId,
      modalidadId,
    );

    progreso.porcentaje = Math.floor((nivelesCompletados / totalNiveles) * 100);

    return this.progresoRepo.save(progreso);
  }

  /**
   * Cuenta cuántos niveles ha completado el usuario en una modalidad.
   * Usa la query de referencia del SQL original.
   */
  private async contarNivelesCompletados(
    usuarioId: string,
    modalidadId: number,
  ): Promise<number> {
    const resultado = await this.progresoRepo.manager.query(
      `
      SELECT COUNT(*) AS completados
      FROM niveles n
      WHERE n.modalidad_id = ?
      AND NOT EXISTS (
        SELECT 1
        FROM misiones m
        WHERE m.nivel_id = n.id
        AND m.es_principal = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM intentos i
          WHERE i.mision_id = m.id
          AND i.usuario_id = ?
          AND i.resultado = 'correcto'
          AND i.origen = 'nivel'
        )
      )
      `,
      [modalidadId, usuarioId],
    );

    return Number(resultado[0]?.completados ?? 0);
  }

  /**
   * Actualiza el nivel_actual del usuario al siguiente nivel disponible.
   */
  async actualizarNivelActual(
    usuarioId: string,
    modalidadId: number,
  ): Promise<void> {
    const progreso = await this.obtenerOCrear(usuarioId, modalidadId);

    // Niveles ordenados
    const niveles = await this.nivelesRepo.find({
      where: { modalidadId },
      order: { orden: 'ASC' },
    });

    // Buscar el primer nivel NO completado
    for (const nivel of niveles) {
      const pendientes = await this.progresoRepo.manager.query(
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
        [nivel.id, usuarioId],
      );

      const cantidadPendientes = Number(pendientes[0]?.pendientes ?? 0);

      if (cantidadPendientes > 0) {
        progreso.nivelActualId = nivel.id;
        await this.progresoRepo.save(progreso);
        return;
      }
    }

    // Todos los niveles completados → mantener el último
    if (niveles.length > 0) {
      progreso.nivelActualId = niveles[niveles.length - 1].id;
      await this.progresoRepo.save(progreso);
    }
  }
}