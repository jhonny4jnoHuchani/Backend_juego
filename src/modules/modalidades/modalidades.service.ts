import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modalidad } from './entities/modalidad.entity';

@Injectable()
export class ModalidadesService {
  constructor(
    @InjectRepository(Modalidad)
    private readonly modalidadesRepo: Repository<Modalidad>,
  ) {}

  async listar() {
    return this.modalidadesRepo.find({
      order: { ordenMundo: 'ASC' },
    });
  }

  async buscarPorIdOrFail(id: number): Promise<Modalidad> {
    const modalidad = await this.modalidadesRepo.findOne({ where: { id } });
    if (!modalidad) {
      throw new NotFoundException('Modalidad no encontrada');
    }
    return modalidad;
  }
}