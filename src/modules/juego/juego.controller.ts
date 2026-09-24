import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JuegoService } from './juego.service';
import { ResponderMisionDto } from './dto/responder-mision.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '../../common/decorators/current-user.decorator';
import { EstablecerTemaDto } from './dto/establecer-tema.dto';

@UseGuards(JwtAuthGuard)
@Controller('juego')
export class JuegoController {
  constructor(private readonly juegoService: JuegoService) {}

  // ---------- RESPONDER MISIÓN ----------
  @Post('misiones/:id/responder')
  responderMision(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') misionId: string,
    @Body() dto: ResponderMisionDto,
  ) {
    return this.juegoService.responderMision(usuario.id, misionId, dto);
  }

  // ---------- MAPA DEL JUEGO ----------
  @Get('modalidades/:id/mapa')
  mapa(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) modalidadId: number,
  ) {
    return this.juegoService.mapaModalidad(usuario.id, modalidadId);
  }

  // ---------- MI PROGRESO ----------
  @Get('modalidades/:id/mi-progreso')
  miProgreso(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) modalidadId: number,
  ) {
    return this.juegoService.miProgreso(usuario.id, modalidadId);
  }

  // ---------- MI HISTORIAL ----------
  @Get('misiones/:id/mi-historial')
  miHistorial(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') misionId: string,
  ) {
    return this.juegoService.miHistorial(usuario.id, misionId);
  }

  // ---------- MIS INSIGNIAS ----------
  @Get('mis-insignias')
  misInsignias(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.juegoService.misInsignias(usuario.id);
  }

  // ---------- ESTADO DE MISIÓN ----------
  @Get('misiones/:id/estado')
  estadoMision(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') misionId: string,
  ) {
    return this.juegoService.estadoMision(usuario.id, misionId);
  }

  // ---------- ESTABLECER TEMA ----------
  @Post('modalidades/:id/iniciar')
  iniciarModalidad(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) modalidadId: number,
    @Body() dto: EstablecerTemaDto,
  ) {
    return this.juegoService.establecerTema(
      usuario.id,
      modalidadId,
      dto.temaInvestigacion,
    );
  }
}