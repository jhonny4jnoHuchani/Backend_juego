import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GruposService } from './grupos.service';
import { CrearGrupoDto } from './dto/crear-grupo.dto';
import { UnirseGrupoDto } from './dto/unirse-grupo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '../../common/enums/rol.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  // ============================================================
  // DOCENTE
  // ============================================================

  @Roles(Rol.DOCENTE)
  @Post()
  crear(@CurrentUser() usuario: UsuarioAutenticado, @Body() dto: CrearGrupoDto) {
    return this.gruposService.crear(usuario.id, dto);
  }

  @Roles(Rol.DOCENTE)
  @Get('mis-grupos')
  listarDelDocente(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.gruposService.listarDelDocente(usuario.id);
  }

  @Roles(Rol.DOCENTE)
  @Get(':id')
  detalle(@CurrentUser() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.gruposService.detalleDelDocente(usuario.id, id);
  }

  @Roles(Rol.DOCENTE)
  @Patch(':id/expiracion')
  extenderExpiracion(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body('fechaExpiracion') fechaExpiracion: string | null,
  ) {
    return this.gruposService.extenderExpiracion(usuario.id, id, fechaExpiracion);
  }

  @Roles(Rol.DOCENTE)
  @Patch(':id/desactivar')
  desactivar(@CurrentUser() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.gruposService.desactivar(usuario.id, id);
  }

  @Roles(Rol.DOCENTE)
  @Delete(':id')
  eliminar(@CurrentUser() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.gruposService.eliminar(usuario.id, id);
  }

  // ============================================================
  // ESTUDIANTE
  // ============================================================

  @Roles(Rol.ESTUDIANTE)
  @Post('unirse')
  unirse(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: UnirseGrupoDto,
  ) {
    return this.gruposService.unirseConCodigo(usuario.id, dto.codigo);
  }

  @Roles(Rol.ESTUDIANTE)
  @Get('mis-grupos-como-estudiante')
  listarDelEstudiante(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.gruposService.listarDelEstudiante(usuario.id);
  }

  @Roles(Rol.ESTUDIANTE)
  @Delete('salir/:id')
  salir(@CurrentUser() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.gruposService.salirDelGrupo(usuario.id, id);
  }
}