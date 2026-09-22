import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '../../common/enums/rol.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.DOCENTE)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('grupos/:id/progreso')
  progresoDelGrupo(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') grupoId: string,
  ) {
    return this.reportesService.progresoDelGrupo(usuario.id, grupoId);
  }

  @Get('estudiantes/:id/competencias-debiles')
  competenciasDebiles(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') estudianteId: string,
  ) {
    return this.reportesService.competenciasDebiles(usuario.id, estudianteId);
  }
}