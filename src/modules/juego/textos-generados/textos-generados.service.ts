import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TextoGenerado } from './entities/texto-generado.entity';
import { Mision } from '../../misiones/entities/mision.entity';
import { IAEvaluatorService } from '../../ia/ia-evaluator.service';
import { ProgresoService } from '../progreso/progreso.service';

@Injectable()
export class TextosGeneradosService {
  private readonly logger = new Logger(TextosGeneradosService.name);

  constructor(
    @InjectRepository(TextoGenerado)
    private readonly textosRepo: Repository<TextoGenerado>,
    @InjectRepository(Mision)
    private readonly misionesRepo: Repository<Mision>,
    private readonly iaEvaluator: IAEvaluatorService,
    private readonly progresoService: ProgresoService,
  ) {}

  /**
   * Obtiene el texto generado para (usuario, misión).
   * Si no existe, lo genera con la IA y lo guarda.
   * Si la IA falla, usa el texto de respaldo del contenido_json.
   */
  async obtenerOCrear(usuarioId: string, misionId: string) {
    // 1. Cargar la misión
    const mision = await this.misionesRepo.findOne({
      where: { id: misionId },
      relations: { nivel: true },
    });

    if (!mision) {
      throw new NotFoundException('Misión no encontrada');
    }

    if (mision.tipoInteraccion !== 'marcar_errores') {
      throw new NotFoundException(
        'Esta misión no requiere texto generado (no es de tipo marcar_errores)',
      );
    }

    // 2. Buscar si ya existe
    const existente = await this.textosRepo.findOne({
      where: { usuarioId, misionId },
    });

    if (existente) {
      return {
        misionId: mision.id,
        titulo: mision.titulo,
        instruccion:
          (mision.contenidoJson as any)?.instruccion ??
          'Identifica los errores del texto',
        texto: existente.textoGenerado,
        erroresEsperados: existente.erroresEsperadosJson,
      };
    }

    // 3. No existe → generarlo con la IA
    // Cargar tema del estudiante
    const progreso = await this.progresoService.obtenerOCrear(
      usuarioId,
      mision.nivel.modalidadId,
    );

    const temaInvestigacion =
      progreso.temaInvestigacion ?? 'Investigación académica general';

    let texto: string;
    let erroresEsperados: any;
    let respuestasCorrectas: any;

    try {
      this.logger.log(`Generando texto para misión ${misionId}...`);

      const generado = await this.iaEvaluator.generarTextoConErrores(
        mision,
        temaInvestigacion,
      );

      texto = generado.texto;
      erroresEsperados = generado.erroresEsperados;
      respuestasCorrectas = generado.respuestasCorrectas;

      this.logger.log(`✅ Texto generado y guardado para misión ${misionId}`);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(
        `⚠️ Falló la generación IA: ${mensaje}. Usando texto de respaldo.`,
      );

      // Fallback: usar texto fijo del contenido_json
      const contenido = (mision.contenidoJson as any) ?? {};
      texto = contenido.texto ?? 'Texto de respaldo no disponible.';
      erroresEsperados = contenido.erroresEsperados ?? [];
      respuestasCorrectas = { errores: erroresEsperados };
    }

    // 4. Guardar en BD
    const nuevo = this.textosRepo.create({
      usuarioId,
      misionId,
      textoGenerado: texto,
      erroresEsperadosJson: erroresEsperados,
      respuestasCorrectas,
    });

    await this.textosRepo.save(nuevo);

    return {
      misionId: mision.id,
      titulo: mision.titulo,
      instruccion:
        (mision.contenidoJson as any)?.instruccion ??
        'Identifica los errores del texto',
      texto,
      erroresEsperados,
    };
  }

  /**
   * Devuelve el texto guardado + respuestas correctas (uso interno del JuegoService).
   */
  async obtenerParaEvaluacion(usuarioId: string, misionId: string) {
    return this.textosRepo.findOne({
      where: { usuarioId, misionId },
    });
  }
}