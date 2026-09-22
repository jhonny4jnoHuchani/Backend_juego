import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ModalidadesService } from './modalidades.service';
import { NivelesService } from '../niveles/niveles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('modalidades')
export class ModalidadesController {
  constructor(
    private readonly modalidadesService: ModalidadesService,
    private readonly nivelesService: NivelesService,
  ) {}

  @Get()
  listar() {
    return this.modalidadesService.listar();
  }

  @Get(':id/niveles')
  async nivelesDeModalidad(@Param('id', ParseIntPipe) id: number) {
    const modalidad = await this.modalidadesService.buscarPorIdOrFail(id);
    const niveles = await this.nivelesService.listarPorModalidad(id);
    return { modalidad, niveles };
  }
}