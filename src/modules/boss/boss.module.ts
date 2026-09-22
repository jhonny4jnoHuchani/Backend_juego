import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionBoss } from './entities/sesion-boss.entity';
import { Nivel } from '../niveles/entities/nivel.entity';
import { Mision } from '../misiones/entities/mision.entity';
import { BossService } from './boss.service';
import { BossController } from './boss.controller';
import { JuegoModule } from '../juego/juego.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SesionBoss, Nivel, Mision]),
    JuegoModule,
    AuthModule,
  ],
  controllers: [BossController],
  providers: [BossService],
  exports: [BossService],
})
export class BossModule {}