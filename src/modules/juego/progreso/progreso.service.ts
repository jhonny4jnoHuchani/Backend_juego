import { Injectable, BadRequestException } from '@nestjs/common';
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

  // Total de niveles CON misiones principales
  const totalNiveles = await this.progresoRepo.manager.query(
    `
    SELECT COUNT(*) AS total
    FROM niveles n
    WHERE n.modalidad_id = ?
    AND EXISTS (
      SELECT 1 FROM misiones m
      WHERE m.nivel_id = n.id
      AND m.es_principal = TRUE
    )
    `,
    [modalidadId],
  );

  const total = Number(totalNiveles[0]?.total ?? 0);

  if (total === 0) {
    progreso.porcentaje = 0;
    return this.progresoRepo.save(progreso);
  }

  // Niveles completados por el usuario
  const nivelesCompletados = await this.contarNivelesCompletados(
    usuarioId,
    modalidadId,
  );

  progreso.porcentaje = Math.floor((nivelesCompletados / total) * 100);

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
      AND EXISTS (
        SELECT 1 FROM misiones m
        WHERE m.nivel_id = n.id
        AND m.es_principal = TRUE
      )
      AND NOT EXISTS (
        SELECT 1 FROM misiones m
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

  for (const nivel of niveles) {
    // Verificar si el nivel tiene misiones principales
    const tieneMisiones = await this.progresoRepo.manager.query(
      `
      SELECT COUNT(*) AS total
      FROM misiones m
      WHERE m.nivel_id = ?
      AND m.es_principal = TRUE
      `,
      [nivel.id],
    );

    const total = Number(tieneMisiones[0]?.total ?? 0);

    // Si el nivel NO tiene misiones, lo saltamos
    if (total === 0) continue;

    // Contar misiones pendientes en este nivel
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

    // Si tiene misiones pendientes, este es el nivel actual
    if (cantidadPendientes > 0) {
      progreso.nivelActualId = nivel.id;
      await this.progresoRepo.save(progreso);
      return;
    }
  }

  // Si ningún nivel tiene misiones pendientes,
  // mantener el ÚLTIMO nivel CON misiones (no el último de la lista)
  const nivelesConMisiones = await this.progresoRepo.manager.query(
    `
    SELECT n.id
    FROM niveles n
    WHERE n.modalidad_id = ?
    AND EXISTS (
      SELECT 1 FROM misiones m
      WHERE m.nivel_id = n.id
      AND m.es_principal = TRUE
    )
    ORDER BY n.orden DESC
    LIMIT 1
    `,
    [modalidadId],
  );

  if (nivelesConMisiones.length > 0) {
    progreso.nivelActualId = nivelesConMisiones[0].id;
    await this.progresoRepo.save(progreso);
  }
}




    /**
   * Establece el tema de investigación del estudiante para esa modalidad.
   * Regla: solo se puede establecer si NO ha respondido ninguna misión
   * (es decir, no hay XP ganado todavía).
   */
  async establecerTema(
    usuarioId: string,
    modalidadId: number,
    tema: string,
  ): Promise<ProgresoUsuario> {
    const progreso = await this.obtenerOCrear(usuarioId, modalidadId);

    // Regla: solo se puede cambiar antes de empezar (xpTotal === 0)
    // Excepto si no tiene tema todavía (primera vez)
    if (progreso.temaInvestigacion && progreso.xpTotal > 0) {
      throw new BadRequestException(
        'No puedes cambiar tu tema una vez que comenzaste a jugar. ' +
          'Si necesitas cambiarlo, contacta a tu docente.',
      );
    }

    if (!tema || tema.trim().length < 10) {
      throw new BadRequestException(
        'El tema debe tener al menos 10 caracteres.',
      );
    }

    progreso.temaInvestigacion = tema.trim();
    return this.progresoRepo.save(progreso);
  }
}