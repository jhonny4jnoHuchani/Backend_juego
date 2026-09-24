import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('textos_generados')
export class TextoGenerado {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'usuario_id', type: 'bigint', unsigned: true })
  usuarioId: string;

  @ManyToOne('Usuario', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: any;

  @Column({ name: 'mision_id', type: 'bigint', unsigned: true })
  misionId: string;

  @ManyToOne('Mision', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mision_id' })
  mision: any;

  @Column({ name: 'texto_generado', type: 'text' })
  textoGenerado: string;

  @Column({ name: 'errores_esperados_json', type: 'json' })
  erroresEsperadosJson: any;

  @Column({ name: 'respuestas_correctas', type: 'json' })
  respuestasCorrectas: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}