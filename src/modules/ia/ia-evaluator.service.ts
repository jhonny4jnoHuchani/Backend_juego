import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AIProvider } from './interfaces/ai-provider.interface';
import { EvaluacionCompleta } from './interfaces/evaluacion-resultado.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
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
  ) {
    this.providers = [this.gemini, this.groq];
  }

  // ============================================================
  // EVALUAR RESPUESTA (texto_libre)
  // ============================================================
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
        return 'gemini-3.6-flash / 3.7-flash';
      case 'groq':
        return 'openai/gpt-oss-120b';
      default:
        return 'desconocido';
    }
  }
}