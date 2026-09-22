import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JuegoService } from './juego.service';
import { ResponderMisionDto } from './dto/responder-mision.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('juego')
export class JuegoController {
  constructor(private readonly juegoService: JuegoService) {}

  @Post('misiones/:id/responder')
  responderMision(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') misionId: string,
    @Body() dto: ResponderMisionDto,
  ) {
    return this.juegoService.responderMision(usuario.id, misionId, dto);
  }
}