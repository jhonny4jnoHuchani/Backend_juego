import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insignia } from './entities/insignia.entity';
import { UsuarioInsignia } from './entities/usuario-insignia.entity';
import { Intento } from '../intentos/entities/intento.entity';
import { Nivel } from '../../niveles/entities/nivel.entity';
import { ResultadoIntento } from '../../../common/enums/resultado-intento.enum';
import { OrigenIntento } from '../../../common/enums/origen-intento.enum';

@Injectable()
export class InsigniasService {
  private readonly logger = new Logger(InsigniasService.name);

  constructor(
    @InjectRepository(Insignia)
    private readonly insigniasRepo: Repository<Insignia>,
    @InjectRepository(UsuarioInsignia)
    private readonly usuarioInsigniasRepo: Repository<UsuarioInsignia>,
    @InjectRepository(Intento)
    private readonly intentosRepo: Repository<Intento>,
    @InjectRepository(Nivel)
    private readonly nivelesRepo: Repository<Nivel>,
  ) {}

  /**
   * Evalúa todas las reglas y otorga las insignias que correspondan.
   * Devuelve las insignias NUEVAS otorgadas (para que la app las muestre).
   */
  async evaluarYOtorgar(
    usuarioId: string,
    contexto: {
      intentoActualId: string;
      resultadoActual: ResultadoIntento;
      nivelId: string;
      modalidadId: number;
    },
  ): Promise<Insignia[]> {
    if (contexto.resultadoActual !== ResultadoIntento.CORRECTO) {
      return [];
    }

    const nuevas: Insignia[] = [];

    // ---------- Regla 1: Primera misión ----------
    if (await this.cumplePrimeraMision(usuarioId)) {
      const insignia = await this.otorgarSiNoTiene(usuarioId, 'Primera misión');
      if (insignia) nuevas.push(insignia);
    }

    // ---------- Regla 2: Boss derrotado ----------
    if (await this.cumpleBossDerrotado(usuarioId, contexto.nivelId)) {
      const insignia = await this.otorgarSiNoTiene(usuarioId, 'Boss derrotado');
      if (insignia) nuevas.push(insignia);
    }

    // ---------- Regla 3: Racha de 3 ----------
    if (await this.cumpleRachaDe3(usuarioId)) {
      const insignia = await this.otorgarSiNoTiene(usuarioId, 'Racha de 3');
      if (insignia) nuevas.push(insignia);
    }

    // ---------- Regla 4: Mundo completado ----------
    if (await this.cumpleMundoCompletado(usuarioId, contexto.modalidadId)) {
      const insignia = await this.otorgarSiNoTiene(usuarioId, 'Mundo completado');
      if (insignia) nuevas.push(insignia);
    }

    return nuevas;
  }

  // ============================================================
  // REGLAS
  // ============================================================

  private async cumplePrimeraMision(usuarioId: string): Promise<boolean> {
    const count = await this.intentosRepo.count({
      where: {
        usuarioId,
        resultado: ResultadoIntento.CORRECTO,
        origen: OrigenIntento.NIVEL,
      },
    });
    return count === 1; // acaba de tener su primer correcto
  }

  private async cumpleBossDerrotado(
    usuarioId: string,
    nivelId: string,
  ): Promise<boolean> {
    const nivel = await this.nivelesRepo.findOne({ where: { id: nivelId } });
    if (!nivel || nivel.tipo !== 'boss') return false;

    // Todas las misiones principales del nivel deben estar correctas
    const pendientes = await this.intentosRepo.manager.query(
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
      [nivelId, usuarioId],
    );

    return Number(pendientes[0]?.pendientes ?? 0) === 0;
  }

  private async cumpleRachaDe3(usuarioId: string): Promise<boolean> {
    const ultimos = await this.intentosRepo.find({
      where: { usuarioId, origen: OrigenIntento.NIVEL },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    if (ultimos.length < 3) return false;

    return ultimos.every((i) => i.resultado === ResultadoIntento.CORRECTO);
  }

  private async cumpleMundoCompletado(
    usuarioId: string,
    modalidadId: number,
  ): Promise<boolean> {
    const pendientes = await this.intentosRepo.manager.query(
      `
      SELECT COUNT(*) AS pendientes
      FROM niveles n
      WHERE n.modalidad_id = ?
      AND EXISTS (
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

    return Number(pendientes[0]?.pendientes ?? 0) === 0;
  }

  // ============================================================
  // OTORGAMIENTO
  // ============================================================

  private async otorgarSiNoTiene(
    usuarioId: string,
    nombreInsignia: string,
  ): Promise<Insignia | null> {
    const insignia = await this.insigniasRepo.findOne({
      where: { nombre: nombreInsignia },
    });

    if (!insignia) {
      this.logger.warn(`Insignia "${nombreInsignia}" no existe en BD`);
      return null;
    }

    const yaTiene = await this.usuarioInsigniasRepo.findOne({
      where: { usuarioId, insigniaId: insignia.id },
    });

    if (yaTiene) return null;

    await this.usuarioInsigniasRepo.save({
      usuarioId,
      insigniaId: insignia.id,
    });

    this.logger.log(`🏆 Insignia "${nombreInsignia}" otorgada a usuario ${usuarioId}`);
    return insignia;
  }
}