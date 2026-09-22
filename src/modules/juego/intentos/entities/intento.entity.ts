import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../../usuarios/entities/usuario.entity';
import { Mision } from '../../../misiones/entities/mision.entity';
import { OrigenIntento } from '../../../../common/enums/origen-intento.enum';
import { ResultadoIntento } from '../../../../common/enums/resultado-intento.enum';

@Entity('intentos')
export class Intento {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'usuario_id', type: 'bigint', unsigned: true })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: any;

  @Column({ name: 'mision_id', type: 'bigint', unsigned: true })
  misionId: string;

  @ManyToOne(() => Mision, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mision_id' })
  mision: any;

  @Column({
    type: 'enum',
    enum: OrigenIntento,
    default: OrigenIntento.NIVEL,
  })
  origen: OrigenIntento;

  @Column({ name: 'respuesta_texto', type: 'text', nullable: true })
  respuestaTexto: string | null;

  @Column({ name: 'vidas_restantes', type: 'tinyint', unsigned: true, nullable: true })
  vidasRestantes: number | null;

  @Column({
    type: 'enum',
    enum: ResultadoIntento,
    nullable: true,
  })
  resultado: ResultadoIntento | null;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  puntuacion: number | null;

  @Column({ name: 'evaluacion_ia_id', type: 'bigint', unsigned: true, nullable: true })
  evaluacionIaId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}