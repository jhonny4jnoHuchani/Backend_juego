import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grupo } from '../grupos/entities/grupo.entity';
import { GrupoEstudiante } from '../grupos/entities/grupo-estudiante.entity';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grupo, GrupoEstudiante]),
    AuthModule,
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}