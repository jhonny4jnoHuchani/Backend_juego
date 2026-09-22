import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { NivelesService } from './niveles.service';
import { MisionesService } from '../misiones/misiones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('niveles')
export class NivelesController {
  constructor(
    private readonly nivelesService: NivelesService,
    private readonly misionesService: MisionesService,
  ) {}

  @Get(':id/misiones')
  async misionesDeNivel(@Param('id') id: string) {
    const nivel = await this.nivelesService.buscarPorIdOrFail(id);
    const misiones = await this.misionesService.listarPorNivel(id);
    return { nivel, misiones };
  }
}