import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mision } from './entities/mision.entity';
import { MisionesService } from './misiones.service';
import { MisionesController } from './misiones.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mision]), AuthModule],
  controllers: [MisionesController],
  providers: [MisionesService],
  exports: [MisionesService],
})
export class MisionesModule {}