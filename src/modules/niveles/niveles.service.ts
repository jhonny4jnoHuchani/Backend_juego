import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nivel } from './entities/nivel.entity';

@Injectable()
export class NivelesService {
  constructor(
    @InjectRepository(Nivel)
    private readonly nivelesRepo: Repository<Nivel>,
  ) {}

  async listarPorModalidad(modalidadId: number) {
    return this.nivelesRepo.find({
      where: { modalidadId },
      order: { orden: 'ASC' },
    });
  }

  async buscarPorIdOrFail(id: string): Promise<Nivel> {
    const nivel = await this.nivelesRepo.findOne({ where: { id } });
    if (!nivel) {
      throw new NotFoundException('Nivel no encontrado');
    }
    return nivel;
  }
}