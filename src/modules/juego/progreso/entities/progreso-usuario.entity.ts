import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { Modalidad } from '../../../modalidades/entities/modalidad.entity';
import { Nivel } from '../../../niveles/entities/nivel.entity';

@Entity('progreso_usuario')
export class ProgresoUsuario {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'usuario_id', type: 'bigint', unsigned: true })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: any;

  @Column({ name: 'modalidad_id', type: 'int', unsigned: true })
  modalidadId: number;

  @ManyToOne(() => Modalidad, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modalidad_id' })
  modalidad: any;

  @Column({ name: 'nivel_actual_id', type: 'bigint', unsigned: true, nullable: true })
  nivelActualId: string | null;

  @ManyToOne(() => Nivel, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'nivel_actual_id' })
  nivelActual: any;

  @Column({ name: 'tema_investigacion', type: 'text', nullable: true })
  temaInvestigacion: string | null;

  @Column({ name: 'xp_total', type: 'int', unsigned: true, default: 0 })
  xpTotal: number;

  @Column({
    name: 'puntos_investigacion_total',
    type: 'int',
    unsigned: true,
    default: 0,
  })
  puntosInvestigacionTotal: number;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  porcentaje: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}