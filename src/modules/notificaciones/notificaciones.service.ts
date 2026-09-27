import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionesRepo: Repository<Notificacion>,
  ) {}

  // ============================================================
  // CREAR NOTIFICACIÓN
  // ============================================================
  async crear(data: {
    usuarioId: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    referenciaId?: string | null;
  }): Promise<Notificacion> {
    const notificacion = this.notificacionesRepo.create({
      usuarioId: data.usuarioId,
      tipo: data.tipo,
      titulo: data.titulo,
      mensaje: data.mensaje,
      referenciaId: data.referenciaId ?? null,
      leida: false,
    });

    const guardada = await this.notificacionesRepo.save(notificacion);

    this.logger.log(
      `📬 Notificación creada para usuario ${data.usuarioId}: ${data.titulo}`,
    );

    return guardada;
  }

  // ============================================================
  // LISTAR NOTIFICACIONES DE UN USUARIO
  // ============================================================
  async listarDelUsuario(usuarioId: string) {
    const notificaciones = await this.notificacionesRepo.find({
      where: { usuarioId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return {
      notificaciones,
      total: notificaciones.length,
    };
  }

  // ============================================================
  // CONTADOR DE NO LEÍDAS
  // ============================================================
  async contadorNoLeidas(usuarioId: string) {
    const count = await this.notificacionesRepo.count({
      where: { usuarioId, leida: false },
    });

    return { noLeidas: count };
  }

  // ============================================================
  // MARCAR UNA COMO LEÍDA
  // ============================================================
  async marcarComoLeida(usuarioId: string, notificacionId: string) {
    const notificacion = await this.notificacionesRepo.findOne({
      where: { id: notificacionId, usuarioId },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notificacion.leida = true;
    await this.notificacionesRepo.save(notificacion);

    return { mensaje: 'Notificación marcada como leída' };
  }

  // ============================================================
  // MARCAR TODAS COMO LEÍDAS
  // ============================================================
  async marcarTodasComoLeidas(usuarioId: string) {
    await this.notificacionesRepo.update(
      { usuarioId, leida: false },
      { leida: true },
    );

    return { mensaje: 'Todas las notificaciones marcadas como leídas' };
  }
}