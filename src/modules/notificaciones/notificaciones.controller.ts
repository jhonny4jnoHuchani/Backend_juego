import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get('mis-notificaciones')
  listar(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.notificacionesService.listarDelUsuario(usuario.id);
  }

  @Get('contador-no-leidas')
  contador(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.notificacionesService.contadorNoLeidas(usuario.id);
  }

  @Patch(':id/leer')
  marcarLeida(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') id: string,
  ) {
    return this.notificacionesService.marcarComoLeida(usuario.id, id);
  }

  @Patch('leer-todas')
  marcarTodasLeidas(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.notificacionesService.marcarTodasComoLeidas(usuario.id);
  }
}