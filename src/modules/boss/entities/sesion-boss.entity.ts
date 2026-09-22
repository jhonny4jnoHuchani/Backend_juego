import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Nivel } from '../../niveles/entities/nivel.entity';

@Entity('sesiones_boss')
export class SesionBoss {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'usuario_id', type: 'bigint', unsigned: true })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: any;

  @Column({ name: 'nivel_id', type: 'bigint', unsigned: true })
  nivelId: string;

  @ManyToOne(() => Nivel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nivel_id' })
  nivel: any;

  @Column({ name: 'iniciado_en', type: 'datetime' })
  iniciadoEn: Date;

  @Column({ name: 'duracion_segundos', type: 'int', unsigned: true, default: 900 })
  duracionSegundos: number;

  @Column({ type: 'boolean', default: false })
  finalizado: boolean;

  @Column({
    name: 'resultado_final',
    type: 'enum',
    enum: ['superado', 'no_superado'],
    nullable: true,
  })
  resultadoFinal: 'superado' | 'no_superado' | null;
}