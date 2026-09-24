import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TextoGenerado } from './entities/texto-generado.entity';
import { Mision } from '../../misiones/entities/mision.entity';
import { TextosGeneradosService } from './textos-generados.service';
import { IAModule } from '../../ia/ia.module';
import { ProgresoService } from '../progreso/progreso.service';
import { ProgresoUsuario } from '../progreso/entities/progreso-usuario.entity';
import { Nivel } from '../../niveles/entities/nivel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TextoGenerado, Mision, ProgresoUsuario, Nivel]),
    IAModule,
  ],
  providers: [TextosGeneradosService, ProgresoService],
  exports: [TextosGeneradosService],
})
export class TextosGeneradosModule {}