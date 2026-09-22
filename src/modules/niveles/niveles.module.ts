import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nivel } from './entities/nivel.entity';
import { NivelesService } from './niveles.service';
import { NivelesController } from './niveles.controller';
import { MisionesModule } from '../misiones/misiones.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Nivel]), MisionesModule, AuthModule],
  controllers: [NivelesController],
  providers: [NivelesService],
  exports: [NivelesService],
})
export class NivelesModule {}