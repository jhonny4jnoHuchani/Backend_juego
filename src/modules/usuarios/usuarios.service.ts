import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Rol } from '../../common/enums/rol.enum';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuariosRepo.findOne({ where: { email } });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuariosRepo.findOne({ where: { id } });
  }

  async buscarPorIdOrFail(id: string): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async crear(data: {
    nombre: string;
    email: string;
    passwordHash: string;
    rol: Rol;
    universidad?: string;
    carrera?: string;
    semestre?: string;
  }): Promise<Usuario> {
    const usuario = this.usuariosRepo.create(data);
    return this.usuariosRepo.save(usuario);
  }
}