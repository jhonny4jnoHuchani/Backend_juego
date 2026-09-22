import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from '../../../common/enums/rol.enum';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: Rol, default: Rol.ESTUDIANTE })
  rol: Rol;

  @Column({ type: 'varchar', length: 150, nullable: true })
  universidad: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  carrera: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  semestre: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}