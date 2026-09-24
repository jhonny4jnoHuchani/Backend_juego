import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from '../interfaces/ai-provider.interface';
import { EvaluacionResultado } from '../interfaces/evaluacion-resultado.interface';
import { JsonValidatorService } from '../validators/json-validator.service';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly nombre = 'gemini';

  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;
  private readonly modeloPrimario: string;
  private readonly modeloFallback: string;

  constructor(
    private readonly config: ConfigService,
    private readonly validator: JsonValidatorService,
  ) {
    const apiKey = this.config.get<string>('ia.geminiApiKey') ?? '';
    this.client = new GoogleGenerativeAI(apiKey);
    this.modeloPrimario = this.config.get<string>('ia.geminiModelPrimary') ?? 'gemini-3.6-flash';
    this.modeloFallback = this.config.get<string>('ia.geminiModelFallback') ?? 'gemini-3.7-flash';
  }

  async evaluar(prompt: string): Promise<EvaluacionResultado> {
    // Intento 1: modelo primario
    try {
      return await this.ejecutar(this.modeloPrimario, prompt);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(
        `Modelo primario (${this.modeloPrimario}) falló: ${mensaje}. Probando fallback...`,
      );
    }

    // Intento 2: modelo fallback
    return await this.ejecutar(this.modeloFallback, prompt);
  }

  private async ejecutar(modelo: string, prompt: string): Promise<EvaluacionResultado> {
    const model = this.client.getGenerativeModel({
      model: modelo,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de 30s excedido')), 30000),
    );

    const respuesta = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ]);

    const texto = respuesta.response.text();

    const json = this.validator.extraerJson(texto);

    if (!json) {
      throw new Error('Gemini devolvió un JSON inválido');
    }

    if (!this.validator.validarEstructura(json)) {
      throw new Error('JSON de Gemini no cumple con la estructura esperada');
    }

    return json;
  }
}