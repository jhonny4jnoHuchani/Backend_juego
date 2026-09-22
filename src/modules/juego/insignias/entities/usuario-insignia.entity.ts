import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { Insignia } from './insignia.entity';

@Entity('usuario_insignias')
export class UsuarioInsignia {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'usuario_id', type: 'bigint', unsigned: true })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: any;

  @Column({ name: 'insignia_id', type: 'int', unsigned: true })
  insigniaId: number;

  @ManyToOne(() => Insignia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'insignia_id' })
  insignia: any;

  @CreateDateColumn({ name: 'obtenida_en', type: 'timestamp' })
  obtenidaEn: Date;
}