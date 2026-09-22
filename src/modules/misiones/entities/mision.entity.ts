import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('misiones')
export class Mision {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'nivel_id', type: 'bigint', unsigned: true })
  nivelId: string;

  @ManyToOne('Nivel', 'misiones', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nivel_id' })
  nivel: any;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  enunciado: string;

  @Column({
    name: 'tipo_interaccion',
    type: 'enum',
    enum: [
      'texto_libre',
      'arrastrar_soltar',
      'seleccion_multiple',
      'captura_objetivo',
      'marcar_errores',
    ],
  })
  tipoInteraccion:
    | 'texto_libre'
    | 'arrastrar_soltar'
    | 'seleccion_multiple'
    | 'captura_objetivo'
    | 'marcar_errores';

  @Column({ name: 'contenido_json', type: 'json', nullable: true })
  contenidoJson: any | null;

  @Column({ name: 'rubric_json', type: 'json', nullable: true })
  rubricJson: any | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  competencia: string | null;

  @Column({ name: 'es_principal', type: 'boolean', default: true })
  esPrincipal: boolean;

  @Column({ name: 'vidas_iniciales', type: 'tinyint', unsigned: true, default: 3 })
  vidasIniciales: number;

  @Column({ name: 'xp_recompensa', type: 'int', unsigned: true, default: 100 })
  xpRecompensa: number;

  @Column({
    name: 'puntos_investigacion',
    type: 'int',
    unsigned: true,
    default: 20,
  })
  puntosInvestigacion: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}