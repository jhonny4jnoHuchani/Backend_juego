import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modalidad } from './entities/modalidad.entity';
import { ModalidadesService } from './modalidades.service';
import { ModalidadesController } from './modalidades.controller';
import { NivelesModule } from '../niveles/niveles.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Modalidad]), NivelesModule, AuthModule],
  controllers: [ModalidadesController],
  providers: [ModalidadesService],
  exports: [ModalidadesService],
})
export class ModalidadesModule {}