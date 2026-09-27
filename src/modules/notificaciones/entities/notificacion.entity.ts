import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'usuario_id', type: 'bigint', unsigned: true })
  usuarioId: string;

  @ManyToOne('Usuario', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: any;

  @Column({
    type: 'enum',
    enum: [
      'recomendacion_asignada',
      'recomendacion_completada',
      'insignia_obtenida',
      'nivel_completado',
    ],
  })
  tipo: string;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ name: 'referencia_id', type: 'bigint', unsigned: true, nullable: true })
  referenciaId: string | null;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}