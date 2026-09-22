import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('niveles')
export class Nivel {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'modalidad_id', type: 'int', unsigned: true })
  modalidadId: number;

  @ManyToOne('Modalidad', 'niveles', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modalidad_id' })
  modalidad: any;

  @Column({ type: 'int', unsigned: true })
  numero: number;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'int', unsigned: true })
  orden: number;

  @Column({ type: 'enum', enum: ['estandar', 'boss'], default: 'estandar' })
  tipo: 'estandar' | 'boss';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany('Mision', 'nivel')
  misiones: any[];
}