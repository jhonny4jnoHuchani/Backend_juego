import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Intento } from '../../intentos/entities/intento.entity';

@Entity('evaluaciones_ia')
export class EvaluacionIA {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'intento_id', type: 'bigint', unsigned: true })
  intentoId: string;

  @ManyToOne(() => Intento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'intento_id' })
  intento: any;

  @Column({ type: 'varchar', length: 50 })
  proveedor: string;

  @Column({ name: 'intentos_formato', type: 'tinyint', unsigned: true, default: 1 })
  intentosFormato: number;

  @Column({ name: 'respuesta_json', type: 'json' })
  respuestaJson: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}