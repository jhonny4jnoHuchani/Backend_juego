import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mision } from './entities/mision.entity';

@Injectable()
export class MisionesService {
  constructor(
    @InjectRepository(Mision)
    private readonly misionesRepo: Repository<Mision>,
  ) {}

  async listarPorNivel(nivelId: string) {
    return this.misionesRepo.find({
      where: { nivelId },
      order: { createdAt: 'ASC' },
    });
  }

  async buscarPorIdOrFail(id: string): Promise<Mision> {
    const mision = await this.misionesRepo.findOne({ where: { id } });
    if (!mision) {
      throw new NotFoundException('Misión no encontrada');
    }
    return mision;
  }
}