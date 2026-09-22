import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RecomendacionesService } from './recomendaciones.service';
import { CrearRecomendacionDto } from './dto/crear-recomendacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '../../common/enums/rol.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recomendaciones')
export class RecomendacionesController {
  constructor(
    private readonly recomendacionesService: RecomendacionesService,
  ) {}

  // ============================================================
  // DOCENTE
  // ============================================================

  @Roles(Rol.DOCENTE)
  @Post()
  crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CrearRecomendacionDto,
  ) {
    return this.recomendacionesService.crear(usuario.id, dto);
  }

  @Roles(Rol.DOCENTE)
  @Get('mis-asignaciones')
  listarDelDocente(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.recomendacionesService.listarDelDocente(usuario.id);
  }

  @Roles(Rol.DOCENTE)
  @Delete(':id')
  eliminar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') id: string,
  ) {
    return this.recomendacionesService.eliminar(usuario.id, id);
  }

  // ============================================================
  // ESTUDIANTE
  // ============================================================

  @Roles(Rol.ESTUDIANTE)
  @Get('mis-recomendaciones')
  listarDelEstudiante(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.recomendacionesService.listarDelEstudiante(usuario.id);
  }
}