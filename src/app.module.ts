import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AuthModule } from './modules/auth/auth.module';
import { ModalidadesModule } from './modules/modalidades/modalidades.module';
import { NivelesModule } from './modules/niveles/niveles.module';
import { MisionesModule } from './modules/misiones/misiones.module';
import { IAModule } from './modules/ia/ia.module';
import { JuegoModule } from './modules/juego/juego.module';
import { BossModule } from './modules/boss/boss.module';
import { GruposModule } from './modules/grupos/grupos.module';
import { RecomendacionesModule } from './modules/recomendaciones/recomendaciones.module';
import { ReportesModule } from './modules/reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: false,
        logging: false,
      }),
    }),
    UsuariosModule,
    AuthModule,
    ModalidadesModule,
    NivelesModule,
    MisionesModule,
    IAModule,
    JuegoModule,
    BossModule,
    GruposModule,
    RecomendacionesModule,
    ReportesModule,     
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}