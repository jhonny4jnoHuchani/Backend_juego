import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('modalidades')
export class Modalidad {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({
    type: 'enum',
    enum: ['tesis', 'tesina', 'monografia', 'articulo'],
    unique: true,
  })
  nombre: 'tesis' | 'tesina' | 'monografia' | 'articulo';

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'orden_mundo', type: 'int', unsigned: true })
  ordenMundo: number;

  @OneToMany('Nivel', 'modalidad')
  niveles: any[];
}