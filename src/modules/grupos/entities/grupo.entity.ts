import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('grupos')
export class Grupo {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'docente_id', type: 'bigint', unsigned: true })
  docenteId: string;

  @ManyToOne('Usuario', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'docente_id' })
  docente: any;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ name: 'codigo_acceso', type: 'char', length: 6, unique: true })
  codigoAcceso: string;

  @Column({ name: 'fecha_expiracion', type: 'datetime', nullable: true })
  fechaExpiracion: Date | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}