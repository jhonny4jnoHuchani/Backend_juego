import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecomendacionDocente } from './entities/recomendacion-docente.entity';
import { Mision } from '../misiones/entities/mision.entity';
import { RecomendacionesService } from './recomendaciones.service';
import { RecomendacionesController } from './recomendaciones.controller';
import { GruposModule } from '../grupos/grupos.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecomendacionDocente, Mision]),
    GruposModule,
    AuthModule,
  ],
  controllers: [RecomendacionesController],
  providers: [RecomendacionesService],
  exports: [RecomendacionesService],
})
export class RecomendacionesModule {}