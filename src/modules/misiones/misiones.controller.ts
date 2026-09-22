import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MisionesService } from './misiones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('misiones')
export class MisionesController {
  constructor(private readonly misionesService: MisionesService) {}

  @Get(':id')
  async detalle(@Param('id') id: string) {
    const mision = await this.misionesService.buscarPorIdOrFail(id);
    // No exponemos el rubric al estudiante
    const { rubricJson, ...resto } = mision;
    return resto;
  }
}