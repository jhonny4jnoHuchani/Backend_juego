import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluacionIA } from './entities/evaluacion-ia.entity';
import { EvaluacionCompleta } from '../../ia/interfaces/evaluacion-resultado.interface';

@Injectable()
export class EvaluacionesIaService {
  constructor(
    @InjectRepository(EvaluacionIA)
    private readonly evaluacionesRepo: Repository<EvaluacionIA>,
  ) {}

  /**
   * Guarda la evaluación IA asociada a un intento.
   * Extrae los campos _meta del resultado para poblar columnas específicas.
   */
  async guardar(data: {
    intentoId: string;
    evaluacion: EvaluacionCompleta;
  }): Promise<EvaluacionIA> {
    const { _meta, ...respuestaSinMeta } = data.evaluacion;

    const evaluacion = this.evaluacionesRepo.create({
      intentoId: data.intentoId,
      proveedor: _meta.proveedor,
      intentosFormato: _meta.intentosFormato,
      respuestaJson: respuestaSinMeta,
    });

    return this.evaluacionesRepo.save(evaluacion);
  }

  async buscarPorIntento(intentoId: string): Promise<EvaluacionIA | null> {
    return this.evaluacionesRepo.findOne({ where: { intentoId } });
  }
}