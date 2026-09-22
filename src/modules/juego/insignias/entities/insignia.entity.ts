import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('insignias')
export class Insignia {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'icono_url', type: 'varchar', length: 255, nullable: true })
  iconoUrl: string | null;
}