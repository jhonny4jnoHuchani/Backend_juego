import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Intento } from './entities/intento.entity';
import { OrigenIntento } from '../../../common/enums/origen-intento.enum';
import { ResultadoIntento } from '../../../common/enums/resultado-intento.enum';

@Injectable()
export class IntentosService {
  constructor(
    @InjectRepository(Intento)
    private readonly intentosRepo: Repository<Intento>,
  ) {}

  /**
   * Cuenta los intentos incorrectos de las últimas 24h
   * para un usuario y una misión en específico.
   */
  async contarIncorrectosRecientes(
    usuarioId: string,
    misionId: string,
  ): Promise<number> {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.intentosRepo.count({
      where: {
        usuarioId,
        misionId,
        resultado: ResultadoIntento.INCORRECTO,
        createdAt: MoreThan(hace24h),
      },
    });
  }

  /**
   * Devuelve true si el usuario ya completó la misión
   * (tiene al menos 1 intento correcto con origen='nivel').
   */
  async yaCompletada(
    usuarioId: string,
    misionId: string,
    origen: OrigenIntento = OrigenIntento.NIVEL,
  ): Promise<boolean> {
    const count = await this.intentosRepo.count({
      where: {
        usuarioId,
        misionId,
        origen,
        resultado: ResultadoIntento.CORRECTO,
      },
    });
    return count > 0;
  }

  /**
   * Guarda un intento nuevo.
   */
  async guardar(data: {
    usuarioId: string;
    misionId: string;
    origen: OrigenIntento;
    respuestaTexto: string;
    vidasRestantes: number;
    resultado: ResultadoIntento;
    puntuacion: number;
  }): Promise<Intento> {
    const intento = this.intentosRepo.create(data);
    return this.intentosRepo.save(intento);
  }

  /**
   * Actualiza el intento con la referencia a su evaluación IA.
   */
  async asignarEvaluacion(intentoId: string, evaluacionIaId: string): Promise<void> {
    await this.intentosRepo.update(
      { id: intentoId },
      { evaluacionIaId },
    );
  }

  /**
   * Devuelve el conteo de intentos correctos consecutivos más recientes
   * para un usuario, sin importar la misión.
   * Se usa para la insignia "Racha de 3".
   */
  async obtenerRachaActual(usuarioId: string): Promise<number> {
    const ultimos = await this.intentosRepo.find({
      where: { usuarioId, origen: OrigenIntento.NIVEL },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    let racha = 0;
    for (const intento of ultimos) {
      if (intento.resultado === ResultadoIntento.CORRECTO) {
        racha++;
      } else {
        break;
      }
    }
    return racha;
  }

  /**
   * Devuelve los intentos de un usuario en una misión (historial completo).
   */
  async historialPorMision(usuarioId: string, misionId: string): Promise<Intento[]> {
    return this.intentosRepo.find({
      where: { usuarioId, misionId },
      order: { createdAt: 'DESC' },
    });
  }
}