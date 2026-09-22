import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BossService } from './boss.service';
import { ResponderBossDto } from './dto/responder-boss.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('boss')
export class BossController {
  constructor(private readonly bossService: BossService) {}

  @Post('niveles/:id/iniciar')
  iniciar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') nivelId: string,
  ) {
    return this.bossService.iniciar(usuario.id, nivelId);
  }

  @Get('sesiones/:id')
  consultar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') sesionId: string,
  ) {
    return this.bossService.consultar(usuario.id, sesionId);
  }

  @Post('sesiones/:id/responder')
  responder(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id') sesionId: string,
    @Body() dto: ResponderBossDto,
  ) {
    return this.bossService.responder(usuario.id, sesionId, dto);
  }
}