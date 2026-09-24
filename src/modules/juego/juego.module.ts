import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Módulos externos
import { IAModule } from '../ia/ia.module';
import { MisionesModule } from '../misiones/misiones.module';
import { NivelesModule } from '../niveles/niveles.module';
import { AuthModule } from '../auth/auth.module';
import { RecomendacionesModule } from '../recomendaciones/recomendaciones.module';
import { TextosGeneradosModule } from './textos-generados/textos-generados.module';

// Entidades del juego
import { Intento } from './intentos/entities/intento.entity';
import { EvaluacionIA } from './evaluaciones-ia/entities/evaluacion-ia.entity';
import { ProgresoUsuario } from './progreso/entities/progreso-usuario.entity';
import { Insignia } from './insignias/entities/insignia.entity';
import { UsuarioInsignia } from './insignias/entities/usuario-insignia.entity';
import { Mision } from '../misiones/entities/mision.entity';
import { Nivel } from '../niveles/entities/nivel.entity';

// Servicios
import { JuegoService } from './juego.service';
import { IntentosService } from './intentos/intentos.service';
import { EvaluacionesIaService } from './evaluaciones-ia/evaluaciones-ia.service';
import { ProgresoService } from './progreso/progreso.service';
import { InsigniasService } from './insignias/insignias.service';

// Controller
import { JuegoController } from './juego.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Intento,
      EvaluacionIA,
      ProgresoUsuario,
      Insignia,
      UsuarioInsignia,
      Mision,
      Nivel,
    ]),
    IAModule,
    MisionesModule,
    NivelesModule,
    AuthModule,
    RecomendacionesModule,
    TextosGeneradosModule,   // ← NUEVO
  ],
  controllers: [JuegoController],
  providers: [
    JuegoService,
    IntentosService,
    EvaluacionesIaService,
    ProgresoService,
    InsigniasService,
  ],
  exports: [JuegoService],
})
export class JuegoModule {}