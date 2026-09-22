import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('grupo_estudiantes')
export class GrupoEstudiante {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'grupo_id', type: 'bigint', unsigned: true })
  grupoId: string;

  @ManyToOne('Grupo', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_id' })
  grupo: any;

  @Column({ name: 'usuario_id', type: 'bigint', unsigned: true })
  usuarioId: string;

  @ManyToOne('Usuario', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: any;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamp' })
  joinedAt: Date;
}