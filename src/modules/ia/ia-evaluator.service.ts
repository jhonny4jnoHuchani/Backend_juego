import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AIProvider } from './interfaces/ai-provider.interface';
import { EvaluacionCompleta } from './interfaces/evaluacion-resultado.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { Mision } from '../misiones/entities/mision.entity';

@Injectable()
export class IAEvaluatorService {
  private readonly logger = new Logger(IAEvaluatorService.name);
  private readonly providers: AIProvider[];

  constructor(
    private readonly promptBuilder: PromptBuilderService,
    private readonly gemini: GeminiProvider,
    private readonly groq: GroqProvider,
  ) {
    // Orden de intentos: Gemini → Groq
    // (Gemini internamente ya prueba primario + fallback)
    this.providers = [this.gemini, this.groq];
  }

  async evaluar(mision: Mision, respuestaEstudiante: string): Promise<EvaluacionCompleta> {
    const prompt = this.promptBuilder.construirPrompt(mision, respuestaEstudiante);
    const inicio = Date.now();

    for (const provider of this.providers) {
      const intentosMaximos = 2; // 1 intento + 1 reintento por JSON mal formado

      for (let intento = 1; intento <= intentosMaximos; intento++) {
        try {
          this.logger.log(
            `Evaluando con ${provider.nombre} (intento ${intento}/${intentosMaximos})...`,
          );

          const resultado = await provider.evaluar(prompt);
          const duracionMs = Date.now() - inicio;

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

            if (intento === intentosMaximos) {
                this.logger.warn(
                `Cambiando al siguiente proveedor después de ${intentosMaximos} intentos con ${provider.nombre}`,
                );
            }
            }
      }
    }

    throw new ServiceUnavailableException(
      'Todos los proveedores de IA fallaron. Intenta de nuevo en unos minutos.',
    );
  }

  private obtenerModelo(proveedor: string): string {
    switch (proveedor) {
      case 'gemini':
        return 'gemini-3.6-flash / 3.7-flash';
      case 'groq':
        return 'llama-3.1-8b-instant';
      default:
        return 'desconocido';
    }
  }
}