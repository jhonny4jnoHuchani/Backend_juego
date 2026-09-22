import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grupo } from './entities/grupo.entity';
import { GrupoEstudiante } from './entities/grupo-estudiante.entity';
import { GruposService } from './grupos.service';
import { GruposController } from './grupos.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grupo, GrupoEstudiante]),
    UsuariosModule,
    AuthModule,
  ],
  controllers: [GruposController],
  providers: [GruposService],
  exports: [GruposService],
})
export class GruposModule {}