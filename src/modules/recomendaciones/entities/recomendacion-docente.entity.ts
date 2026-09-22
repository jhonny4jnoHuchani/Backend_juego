import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('recomendaciones_docente')
export class RecomendacionDocente {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'docente_id', type: 'bigint', unsigned: true })
  docenteId: string;

  @ManyToOne('Usuario', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'docente_id' })
  docente: any;

  @Column({ name: 'estudiante_id', type: 'bigint', unsigned: true })
  estudianteId: string;

  @ManyToOne('Usuario', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: any;

  @Column({ name: 'mision_id', type: 'bigint', unsigned: true })
  misionId: string;

  @ManyToOne('Mision', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mision_id' })
  mision: any;

  @Column({ type: 'text', nullable: true })
  nota: string | null;

  @Column({ type: 'boolean', default: false })
  completada: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}