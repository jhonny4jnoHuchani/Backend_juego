import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AIProvider } from './interfaces/ai-provider.interface';
import { EvaluacionCompleta } from './interfaces/evaluacion-resultado.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { JsonValidatorService } from './validators/json-validator.service';
import { Mision } from '../misiones/entities/mision.entity';

@Injectable()
export class IAEvaluatorService {
  private readonly logger = new Logger(IAEvaluatorService.name);
  private readonly providers: AIProvider[];

  constructor(
    private readonly promptBuilder: PromptBuilderService,
    private readonly validator: JsonValidatorService,
    private readonly gemini: GeminiProvider,
    private readonly groq: GroqProvider,
    private readonly openai: OpenAIProvider,
  ) {
    this.providers = [this.gemini, this.groq, this.openai];
    //this.providers = [this.openai, this.gemini, this.groq];
  }

//JAH_ EVALUACION CON IA 01-10-2026
  async evaluar(
    mision: Mision,
    respuestaEstudiante: string,
    temaInvestigacion: string | null,
  ): Promise<EvaluacionCompleta> {
    const prompt = this.promptBuilder.construirPrompt(
      mision,
      respuestaEstudiante,
      temaInvestigacion,
    );
    const inicio = Date.now();

    for (const provider of this.providers) {
      const intentosMaximos = 2;

      for (let intento = 1; intento <= intentosMaximos; intento++) {
        try {
          this.logger.log(
            `Evaluando con ${provider.nombre} (intento ${intento}/${intentosMaximos})...`,
          );

          const resultado = await provider.evaluar(prompt);
          const duracionMs = Date.now() - inicio;

          // Validar estructura de evaluación
          if (!this.validator.validarEstructuraEvaluacion(resultado)) {
            throw new Error(
              `JSON de ${provider.nombre} no cumple con la estructura de evaluación`,
            );
          }

          this.logger.log(
            `✅ Evaluación exitosa con ${provider.nombre} (${duracionMs}ms)`,
          );

          return {
            ...resultado,
            _meta: {
              proveedor: provider.nombre,
              modelo: this.obtenerModelo(provider.nombre),
              intentosFormato: intento,
              duracionMs,
            },
          };
        } catch (error) {
          const mensaje = error instanceof Error ? error.message : 'Error desconocido';
          this.logger.warn(
            `❌ ${provider.nombre} intento ${intento} falló: ${mensaje}`,
          );
        }
      }
    }

    throw new ServiceUnavailableException(
      'Todos los proveedores de IA fallaron. Intenta de nuevo en unos minutos.',
    );
  }

  // ============================================================
  // GENERAR TEXTO CON ERRORES (marcar_errores)
  // ============================================================
  async generarTextoConErrores(
    mision: Mision,
    temaInvestigacion: string,
  ): Promise<{
    texto: string;
    erroresEsperados: any;
    respuestasCorrectas: any;
  }> {
    const prompt = this.promptBuilder.construirPromptGenerarTexto(
      mision,
      temaInvestigacion,
    );

    const inicio = Date.now();

    for (const provider of this.providers) {
      const intentosMaximos = 2;

      for (let intento = 1; intento <= intentosMaximos; intento++) {
        try {
          this.logger.log(
            `Generando texto con ${provider.nombre} (intento ${intento}/${intentosMaximos})...`,
          );

          const resultado = await provider.evaluar(prompt);
          const duracionMs = Date.now() - inicio;

          // Validar estructura de texto generado
          if (!this.validator.validarEstructuraTextoGenerado(resultado)) {
            throw new Error(
              `JSON de ${provider.nombre} no cumple con la estructura de texto generado`,
            );
          }

          this.logger.log(
            `✅ Texto generado con ${provider.nombre} (${duracionMs}ms)`,
          );

          const data = resultado as any;
          return {
            texto: data.texto,
            erroresEsperados: data.erroresEsperados,
            respuestasCorrectas: data.respuestasCorrectas,
          };
        } catch (error) {
          const mensaje = error instanceof Error ? error.message : 'Error desconocido';
          this.logger.warn(
            `❌ ${provider.nombre} intento ${intento} falló: ${mensaje}`,
          );
        }
      }
    }

    throw new ServiceUnavailableException(
      'No se pudo generar el texto. Intenta de nuevo en unos minutos.',
    );
  }

  // ============================================================
  // EVALUAR DETECCIÓN DE ERRORES
  // ============================================================
  async evaluarDeteccionErrores(
    mision: Mision,
    textoGenerado: string,
    respuestasCorrectas: any,
    respuestaEstudiante: string,
  ): Promise<EvaluacionCompleta> {
    const prompt = this.promptBuilder.construirPromptEvaluarErrores(
      mision,
      textoGenerado,
      respuestasCorrectas,
      respuestaEstudiante,
    );

    const inicio = Date.now();

    for (const provider of this.providers) {
      const intentosMaximos = 2;

      for (let intento = 1; intento <= intentosMaximos; intento++) {
        try {
          this.logger.log(
            `Evaluando errores con ${provider.nombre} (intento ${intento}/${intentosMaximos})...`,
          );

          const resultado = await provider.evaluar(prompt);
          const duracionMs = Date.now() - inicio;

          // Validar estructura de evaluación
          if (!this.validator.validarEstructuraEvaluacion(resultado)) {
            throw new Error(
              `JSON de ${provider.nombre} no cumple con la estructura de evaluación`,
            );
          }

          this.logger.log(
            `✅ Evaluación de errores exitosa con ${provider.nombre} (${duracionMs}ms)`,
          );

          return {
            ...resultado,
            _meta: {
              proveedor: provider.nombre,
              modelo: this.obtenerModelo(provider.nombre),
              intentosFormato: intento,
              duracionMs,
            },
          };
        } catch (error) {
          const mensaje = error instanceof Error ? error.message : 'Error desconocido';
          this.logger.warn(
            `❌ ${provider.nombre} intento ${intento} falló: ${mensaje}`,
          );
        }
      }
    }

    throw new ServiceUnavailableException(
      'No se pudo evaluar la respuesta. Intenta de nuevo en unos minutos.',
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================
  private obtenerModelo(proveedor: string): string {
    switch (proveedor) {
      case 'gemini':
        return 'gemini-flash';
      case 'groq':
        return 'gpt-oss-120b';
      case 'openai':
        return 'gpt-4.1-nano';
      default:
        return 'desconocido';
    }
  }
    private normalizarModalidad(valor: any): string | null {
    const permitidas = ['monografia', 'tesina', 'tesis', 'articulo'];
    if (typeof valor !== 'string') return null;
    const v = valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    return permitidas.includes(v) ? v : null;
  }

      // ============================================================
  // VALIDAR TEMA DEL ESTUDIANTE
  // ============================================================
  async validarTema(
    tema: string,
    usuario: {
      universidad?: string | null;
      carrera?: string | null;
      semestre?: string | null;
    },
    modalidad: {
      nombre: string;
      descripcion?: string | null;
    },
  ): Promise<{
    valido: boolean;
    elementos: {
      variable: boolean;
      poblacion: boolean;
      contexto: boolean;
      tiempo: boolean;
    };
    razon: string;
    sugerencia: string | null;
    explicacion: string;
    elementosFaltantes: string[];
    elementosPresentes: string[];
    compatibilidad: {
      conCarrera: boolean;
      conModalidad: boolean;
      comentario: string;
    };
    advertenciaCarrera: string | null;
    sugerenciaCarrera: string | null;
    modalidadSugerida: string | null;
  }> {
    const prompt = this.promptBuilder.construirPromptValidarTema(
      tema,
      usuario,
      modalidad,
    );

    for (const provider of this.providers) {
      const intentosMaximos = 2;

      for (let intento = 1; intento <= intentosMaximos; intento++) {
        try {
          this.logger.log(
            `Validando tema con ${provider.nombre} (intento ${intento}/${intentosMaximos})...`,
          );

          const resultado = (await provider.evaluar(prompt)) as any;

          // Validación mínima del JSON
          if (
            !resultado ||
            typeof resultado.valido !== 'boolean' ||
            typeof resultado.razon !== 'string'
          ) {
            throw new Error(
              `JSON de ${provider.nombre} no cumple con la estructura de validación`,
            );
          }

          const elementos = resultado.elementos ?? {
            variable: false,
            poblacion: false,
            contexto: false,
            tiempo: false,
          };
          const compatibilidad = resultado.compatibilidad ?? {
            conCarrera: true,
            conModalidad: true,
            comentario: '',
          };

          // Recalculamos valido: no dependemos de lo que diga el modelo
          const totalElementos = Object.values(elementos).filter(
            (v) => v === true,
          ).length;
          const valido =
            totalElementos >= 3 && compatibilidad.conModalidad !== false;

          this.logger.log(
            `✅ Tema validado con ${provider.nombre} → ${valido ? 'válido' : 'inválido'}`,
          );

          return {
            valido,
            elementos,
            razon: resultado.razon,
            sugerencia: valido ? null : (resultado.sugerencia ?? null),
            explicacion: resultado.explicacion ?? '',
            elementosFaltantes: resultado.elementosFaltantes ?? [],
            elementosPresentes: resultado.elementosPresentes ?? [],
            compatibilidad,
            advertenciaCarrera:
              compatibilidad.conCarrera === false
                ? (resultado.advertenciaCarrera ?? compatibilidad.comentario ?? null)
                : null,
            sugerenciaCarrera: resultado.sugerenciaCarrera ?? null,
            modalidadSugerida:
              !valido || compatibilidad.conModalidad === false
                ? this.normalizarModalidad(resultado.modalidadSugerida)
                : null,
          };
        } catch (error) {
          const mensaje =
            error instanceof Error ? error.message : 'Error desconocido';
          this.logger.warn(
            `❌ ${provider.nombre} intento ${intento} falló: ${mensaje}`,
          );
        }
      }
    }

    // Si todos los providers fallan, dejamos pasar el tema por seguridad
    this.logger.error(
      '⚠️ Todos los proveedores de IA fallaron al validar el tema. Se permite el tema por defecto.',
    );
    return {
      valido: true,
      elementos: {
        variable: true,
        poblacion: true,
        contexto: true,
        tiempo: true,
      },
      razon: 'No se pudo validar el tema (IA no disponible). Se guardó por defecto.',
      sugerencia: null,
      explicacion: '',
      elementosFaltantes: [],
      elementosPresentes: [],
      compatibilidad: {
        conCarrera: true,
        conModalidad: true,
        comentario: '',
      },
      advertenciaCarrera: null,
      sugerenciaCarrera: null,
      modalidadSugerida: null,
    };
  }
  
}